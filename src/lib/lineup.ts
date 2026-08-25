import type { BoardPlayer, FantasyPosition, RosterSlotCounts } from "./types";

export interface Lineup {
  QB: BoardPlayer | null;
  RB: BoardPlayer[];
  WR: BoardPlayer[];
  TE: BoardPlayer | null;
  FLEX: BoardPlayer[];
  bench: BoardPlayer[];
}

const FLEX_POSITIONS: FantasyPosition[] = ["RB", "WR", "TE"];

/**
 * Build a starting lineup from the players you've drafted, given the league's
 * starting slots. Best players (by value) fill each slot; the best leftover
 * RB/WR/TE fill FLEX; the rest go to the bench.
 */
export function buildLineup(drafted: BoardPlayer[], slots: RosterSlotCounts): Lineup {
  const sorted = [...drafted].sort((a, b) => b.value - a.value);
  const byPos = (pos: FantasyPosition) => sorted.filter((p) => p.position === pos);

  const lineup: Lineup = { QB: null, RB: [], WR: [], TE: null, FLEX: [], bench: [] };

  // Core slots.
  const qbs = byPos("QB");
  lineup.QB = qbs[0] ?? null;

  const rbs = byPos("RB");
  lineup.RB = rbs.slice(0, slots.RB);

  const wrs = byPos("WR");
  lineup.WR = wrs.slice(0, slots.WR);

  const tes = byPos("TE");
  lineup.TE = tes[0] ?? null;

  // Remaining eligible players (RBs/WRs/TEs not used as starters) for FLEX + bench.
  const used = new Set<string>();
  for (const p of [lineup.QB, ...lineup.RB, ...lineup.WR, lineup.TE].filter(Boolean)) {
    if (p) used.add(p.player_id);
  }

  const leftover = sorted.filter(
    (p) => !used.has(p.player_id) && FLEX_POSITIONS.includes(p.position),
  );

  // FLEX: fill up to the FLEX count with best leftover flex-eligible players.
  const flexCount = slots.FLEX ?? 0;
  lineup.FLEX = leftover.slice(0, flexCount);

  const flexUsed = new Set(lineup.FLEX.map((p) => p.player_id));

  // Everything not used as a starter is bench.
  lineup.bench = sorted.filter((p) => !used.has(p.player_id) && !flexUsed.has(p.player_id));

  return lineup;
}

/** True if the drafted set fills all starting slots (for "roster complete" states). */
export function isLineupComplete(lineup: Lineup, slots: RosterSlotCounts): boolean {
  return (
    Boolean(lineup.QB) &&
    lineup.RB.length >= slots.RB &&
    lineup.WR.length >= slots.WR &&
    Boolean(lineup.TE) &&
    lineup.FLEX.length >= (slots.FLEX ?? 0)
  );
}
