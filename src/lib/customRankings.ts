import type { FantasyPosition } from "./types";
import type { RankedEntry } from "./espn";
import { normalizeName } from "./espn";
import rawRankings from "@/data/rankings.json";

interface RawRanking {
  name: string;
  position: string;
  rank: number | null;
  adp: string | number | null;
}

/**
 * Authoritative rankings from the ingested FantasyPros consensus snapshot
 * (src/data/rankings.json), normalized to the key format used to join against
 * Sleeper's live player pool. This is the board's primary ordering source.
 */
export function getCustomRankings(): RankedEntry[] {
  return (rawRankings as RawRanking[]).map((e) => ({
    name: normalizeName(e.name),
    position: e.position as FantasyPosition,
    rank: typeof e.rank === "number" ? e.rank : null,
    adp: e.adp == null || e.adp === "" ? null : Number(e.adp),
    percentOwned: null,
  }));
}
