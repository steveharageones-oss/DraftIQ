import type {
  BoardPlayer,
  Recommendation,
  RosterSlotCounts,
  ScoringSettings,
  FantasyPosition,
} from "./types";
import { DEFAULT_ROSTER_SLOTS, DEFAULT_SCORING } from "./types";
import { isLlmEnabled, chatJson } from "./ai/llm";

const FLEX_POSITIONS: FantasyPosition[] = ["RB", "WR", "TE"];

type MarkedPlayer = BoardPlayer & { drafted: boolean };

interface RosterAnalysis {
  counts: Record<string, number>;
  baseNeed: Record<string, number>;
  deficiency: Record<string, number>;
  flexNeed: number;
  needStarters: boolean;
  slots: RosterSlotCounts;
}

function analyzeRoster(
  board: BoardPlayer[],
  draftedPlayerIds: string[],
  slotsPartial: Partial<RosterSlotCounts> | undefined,
): RosterAnalysis {
  const slots: RosterSlotCounts = { ...DEFAULT_ROSTER_SLOTS, ...slotsPartial };
  const byId = new Map(board.map((p) => [p.player_id, p]));

  const counts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  for (const id of draftedPlayerIds) {
    const p = byId.get(id);
    if (p) counts[p.position] = (counts[p.position] ?? 0) + 1;
  }

  const baseNeed: Record<string, number> = {
    QB: slots.QB,
    RB: slots.RB,
    WR: slots.WR,
    TE: slots.TE,
  };

  const deficiency: Record<string, number> = {};
  const surplus: Record<string, number> = {};
  for (const pos of ["QB", "RB", "WR", "TE"]) {
    deficiency[pos] = Math.max(0, baseNeed[pos] - counts[pos]);
    surplus[pos] = Math.max(0, counts[pos] - baseNeed[pos]);
  }

  const flexSurplus = surplus.RB + surplus.WR + surplus.TE;
  const flexNeed = Math.max(0, slots.FLEX - flexSurplus);

  const totalStartersNeeded = baseNeed.QB + baseNeed.RB + baseNeed.WR + baseNeed.TE + slots.FLEX;
  const totalDrafted = counts.QB + counts.RB + counts.WR + counts.TE;

  return {
    counts,
    baseNeed,
    deficiency,
    flexNeed,
    needStarters: totalDrafted < totalStartersNeeded,
    slots,
  };
}

/** Adjust a player's raw value by how much this position is still needed. */
function scoreAvailable(player: MarkedPlayer, analysis: RosterAnalysis): number {
  const pos = player.position;
  const isFlex = FLEX_POSITIONS.includes(pos);
  const deficiency = analysis.deficiency[pos] ?? 0;
  const flexTerm = analysis.flexNeed > 0 && isFlex ? analysis.flexNeed * 0.6 : 0;
  const needWeight = deficiency + flexTerm;
  const needFactor = 1 + 0.16 * Math.min(needWeight, 2.5);
  return player.value * needFactor;
}

function positionLabel(pos: FantasyPosition): string {
  return pos === "QB" ? "quarterback" : pos === "RB" ? "running back" : pos === "WR" ? "wide receiver" : "tight end";
}

function buildReason(top: MarkedPlayer, analysis: RosterAnalysis, style: "start" | "flex" | "value"): string {
  const label = positionLabel(top.position);
  switch (style) {
    case "start":
      return `${top.full_name} is the best remaining player to fill your need at ${label}. ` +
        `You still have openings there, and he's a top-${top.rank} value among players left.`;
    case "flex":
      return `${top.full_name} is the strongest leftover flex option. ` +
        `He beats the other players still on the board at this spot in full-PPR value.`;
    default:
      return `${top.full_name} is the best remaining player by our full-PPR value model. ` +
        `Take the top value here rather than reaching for a weaker player at a need.`;
  }
}

// Prefer core skill players (QB/RB/WR/TE); only fall back to K/DEF when nothing
// else is left, so the assistant doesn't suggest a kicker in the early rounds.
function filterAvailable(marked: MarkedPlayer[]): MarkedPlayer[] {
  const core = marked.filter((p) => !p.drafted && p.position !== "K" && p.position !== "DEF");
  return core.length ? core : marked.filter((p) => !p.drafted);
}

function heuristicAdvice(marked: MarkedPlayer[], analysis: RosterAnalysis): Recommendation {
  const available = filterAvailable(marked);
  if (available.length === 0) throw new Error("No available players left to recommend.");

  const scored = available
    .map((p) => ({ p, s: scoreAvailable(p, analysis) }))
    .sort((a, b) => b.s - a.s || b.p.value - a.p.value);

  const top = scored[0].p;
  const alternatives = scored.slice(1, 4).map((x) => x.p);

  const pos = top.position;
  const needStart = analysis.deficiency[pos] > 0;
  const needFlex = analysis.flexNeed > 0 && FLEX_POSITIONS.includes(pos);
  const style = needStart ? "start" : needFlex ? "flex" : "value";

  const notes: string[] = [];
  if (top.injury_status || (top.status && top.status !== "Active")) {
    notes.push(`Status: ${top.status ?? top.injury_status}${top.injury_status ? ` (${top.injury_status})` : ""} — verify before committing.`);
  }
  if (top.adp != null) {
    notes.push(`Expert ADP ~${Math.round(top.adp)} nearby, so this is fair value.`);
  } else {
    notes.push("No live ADP feed is active; this ranking comes from the built-in value model.");
  }
  if (analysis.needStarters) {
    notes.push("You still have open starting slots — prioritize need over raw value for now.");
  }

  return {
    player: top,
    reason: buildReason(top, analysis, style),
    fit: `Fits as ${style === "start" ? "a starter" : style === "flex" ? "a flex" : "top value"} at ${positionLabel(top.position)}.`,
    alternatives,
    notes,
    engine: "builtin",
  };
}

/** Core entry point: produce a recommendation, using the LLM when enabled. */
export async function generateAdvice(
  board: BoardPlayer[],
  args: {
    draftedPlayerIds: string[];
    unavailablePlayerIds?: string[];
    scoring?: Partial<ScoringSettings>;
    slots?: Partial<RosterSlotCounts>;
    leagueSize?: number;
  },
): Promise<Recommendation> {
  const scoring: ScoringSettings = { ...DEFAULT_SCORING, ...args.scoring };
  const analysis = analyzeRoster(board, args.draftedPlayerIds, args.slots);

  // Availability = the board minus anything already taken (your picks + others').
  const unavailableSet = new Set(args.unavailablePlayerIds ?? args.draftedPlayerIds);
  const marked: MarkedPlayer[] = board.map((p) => ({ ...p, drafted: unavailableSet.has(p.player_id) }));

  const llmConfig = {
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL,
    baseUrl: process.env.AI_BASE_URL,
  };

  if (isLlmEnabled(llmConfig)) {
    try {
      return await generateLlmAdvice(marked, analysis, scoring, llmConfig);
    } catch {
      // Fall through to the heuristic so the app always answers.
    }
  }

  return heuristicAdvice(marked, analysis);
}

async function generateLlmAdvice(
  marked: MarkedPlayer[],
  analysis: RosterAnalysis,
  scoring: ScoringSettings,
  llmConfig: { apiKey?: string; model?: string; baseUrl?: string },
): Promise<Recommendation> {
  const available = filterAvailable(marked).slice(0, 50);
  if (available.length === 0) throw new Error("No players left");

  const boardContext = available
    .map((p) => `- ${p.player_id}|${p.full_name}|${p.position}|value ${Math.round(p.value)}|rank ${p.rank}`)
    .join("\n");

  const system =
    "You are a fantasy football draft assistant. Recommend the next pick in a FULL-PPR league. " +
    "Respond with only a JSON object.";

  const user =
    `Scoring: full PPR (${scoring.ppr} pt/reception), QB(${analysis.slots.QB}) RB(${analysis.slots.RB}) WR(${analysis.slots.WR}) TE(${analysis.slots.TE}) FLEX(${analysis.slots.FLEX}).\n` +
    `Roster now: QB ${analysis.counts.QB}, RB ${analysis.counts.RB}, WR ${analysis.counts.WR}, TE ${analysis.counts.TE}; ` +
    `needs -- QB ${analysis.deficiency.QB}, RB ${analysis.deficiency.RB}, WR ${analysis.deficiency.WR}, TE ${analysis.deficiency.TE}, flex ${analysis.flexNeed}.\n` +
    `Available (id|name|pos|value|rank):\n${boardContext}\n\n` +
    `Pick the single best player to draft next. Return JSON: ` +
    `{"player_name": "...", "player_id": "...", "reason": "2-3 sentences", "fit": "one line", "alternatives": ["name", ...], "notes": ["short note", ...]}.`;

  const parsed = await chatJson<{
    player_name?: string;
    player_id?: string;
    reason?: string;
    fit?: string;
    alternatives?: string[];
    notes?: string[];
  }>(llmConfig, system, user);

  const target =
    available.find((p) => p.player_id === parsed.player_id) ||
    available.find((p) => p.full_name === parsed.player_name) ||
    available[0];

  const alternatives = (parsed.alternatives ?? [])
    .map((name) => available.find((p) => p.full_name === name))
    .filter((p): p is MarkedPlayer => Boolean(p))
    .slice(0, 3);

  const fallback = heuristicAdvice(marked, analysis);

  return {
    player: target,
    reason: parsed.reason ?? fallback.reason,
    fit: parsed.fit ?? fallback.fit,
    alternatives: alternatives.length ? alternatives : fallback.alternatives.slice(0, 3),
    notes: parsed.notes ?? [],
    engine: "llm",
  };
}
