import type { BoardPlayer, SleeperPlayer, FantasyPosition, ScoringSettings } from "./types";
import { DEFAULT_SCORING } from "./types";
import { primaryPosition, playerEligiblePositions } from "./sleeper";
import { EXPERT_TIERS, TIER_BASE } from "../data/baseRankings";
import { normalizeName, type RankedEntry } from "./espn";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

type RankSource = "builtin" | "espn" | "custom";

/**
 * Build the ranked draft board from Sleeper's live pool.
 *
 * The board order intentionally follows the injected expert rankings exactly
 * (custom/FantasyPros consensus, else ESPN), since that is the authoritative
 * source. Players are given a 0-100 value that decreases with their expert
 * rank; anyone not in the top-N expert list falls to a low floor. Built-in
 * tiers are only used when no external ranking source is available.
 */
export function buildBoard(
  players: SleeperPlayer[],
  rankings: RankedEntry[] = [],
  scoring: ScoringSettings = DEFAULT_SCORING,
  sourceLabel: RankSource = "espn",
): BoardPlayer[] {
  void scoring; // scoring is currently cosmetic; the injected rankings drive order.

  const rankedByName = new Map<string, RankedEntry>();
  for (const e of rankings) {
    const key = `${e.position}:${e.name}`;
    if (!rankedByName.has(key)) rankedByName.set(key, e);
  }
  // Team defenses (DEF) have no player name, so match them by team abbreviation.
  const rankedByTeam = new Map<string, RankedEntry>();
  for (const e of rankings) {
    if (e.position === "DEF" && e.team) {
      const key = `DEF:${e.team.toUpperCase()}`;
      if (!rankedByTeam.has(key)) rankedByTeam.set(key, e);
    }
  }
  const rankedCount = Math.max(rankings.length, 1);

  const tierByName = new Map<string, { tier: 1 | 2 | 3 | 4 | 5 | 6; position: FantasyPosition }>();
  for (const s of EXPERT_TIERS) tierByName.set(`${s.position}:${normalizeName(s.name)}`, s);

  const baselines: Array<{
    player: SleeperPlayer;
    pos: FantasyPosition;
    value: number;
    adp: number | null;
    source: RankSource;
    sortKey: number;
  }> = [];

  for (const player of players) {
    const pos = primaryPosition(player);
    const nameKey = `${pos}:${normalizeName(player.full_name)}`;
    const entry =
      rankedByName.get(nameKey) ??
      (pos === "DEF" && player.team ? rankedByTeam.get(`DEF:${player.team.toUpperCase()}`) : undefined);
    const tierEntry = tierByName.get(nameKey);

    let value: number;
    let adp: number | null = null;
    let source: RankSource = "builtin";
    let sortKey = player.search_rank ?? 9999999;

    if (entry && (entry.rank !== null || entry.adp !== null)) {
      const rank = entry.rank ?? entry.adp ?? rankedCount;
      // 100 at overall rank 1, sliding down to ~22 at the bottom of the top-N.
      value = 100 - ((rank - 1) * 78) / (rankedCount - 1 || 1);
      adp = entry.adp;
      source = sourceLabel === "builtin" ? "espn" : sourceLabel;
      sortKey = rank;
    } else if (tierEntry) {
      value = TIER_BASE[tierEntry.tier];
      source = "builtin";
    } else {
      // Not in the top-N expert list: a low floor, clearly below ranked players.
      value = 10 + (pos === "RB" || pos === "WR" ? 5 : pos === "TE" ? 3 : 1);
      source = "builtin";
    }

    baselines.push({
      player,
      pos,
      value: clamp(value, 5, 100),
      adp,
      source,
      sortKey,
    });
  }

  const baselineForId = new Map<string, { sortKey: number }>();
  for (const b of baselines) baselineForId.set(b.player.player_id, b);

  const board: BoardPlayer[] = baselines.map((b) => ({
    player_id: b.player.player_id,
    full_name:
      b.player.full_name ||
      (b.pos === "DEF" && b.player.team ? `${b.player.team} D/ST` : b.player.full_name),
    first_name: b.player.first_name || "",
    last_name: b.player.last_name || "",
    position: b.pos,
    positions: playerEligiblePositions(b.player),
    team: b.player.team,
    status: b.player.status,
    injury_status: b.player.injury_status,
    injury_body_part: b.player.injury_body_part,
    age: b.player.age,
    years_exp: b.player.years_exp,
    value: b.value,
    rank: 0,
    adp: b.adp,
    source: b.source,
  }));

  board.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    const rb = baselineForId.get(b.player_id)?.sortKey ?? 9999999;
    const ra = baselineForId.get(a.player_id)?.sortKey ?? 9999999;
    if (ra !== rb) return rb - ra; // lower sort key = better expert rank
    return a.full_name.localeCompare(b.full_name);
  });
  board.forEach((p, i) => {
    p.rank = i + 1;
  });

  return board;
}

export function filterBoardForPositions(
  board: BoardPlayer[],
  positions: FantasyPosition[],
): BoardPlayer[] {
  if (!positions.length) return board;
  const set = new Set(positions);
  return board.filter((p) => p.positions.some((pos) => set.has(pos)));
}
