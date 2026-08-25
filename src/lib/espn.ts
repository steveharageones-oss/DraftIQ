import type { FantasyPosition } from "./types";

/**
 * Best-effort ESPN ranking source.
 *
 * ESPN's public player endpoint is only reliably populated in a league
 * context, so this is a best-effort enhancement: when it returns ranked
 * players we use them to inform the board's order/value; when it is empty or
 * unreachable we fall back entirely to the built-in engine. It never causes
 * the app to fail.
 */

const ESPN_SEASON = 2025;
const ESPN_URL = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${ESPN_SEASON}/players?scoringPeriodId=0&view=players_wl&view=players_proj&view=players_owner&view=players_risks&view=players_stats_notice&view=players_notes&view=players_draft_ranks&view=players_news&view=players_meta&limit=300`;

export interface RankedEntry {
  name: string; // normalized lowercase full name, used to join with Sleeper
  position: FantasyPosition;
  rank: number | null;
  adp: number | null;
  percentOwned: number | null;
  team?: string | null; // used to match team defenses (DST) by abbreviation
  page?: string | null; // FantasyPros player page slug (e.g. "james-cook.php")
}

const ESPN_POS: Record<number, FantasyPosition> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "DEF",
};

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchEspnRankings(): Promise<RankedEntry[]> {
  if (process.env.ESPN_RANKINGS === "false") return [];
  try {
    const res = await fetch(ESPN_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // ADP changes slowly
    });
    if (!res.ok) return [];

    const data: unknown = await res.json();
    const players = Array.isArray(data)
      ? data
      : ((data as { players?: unknown[] }).players ?? []);

    if (!Array.isArray(players)) return [];

    const entries: RankedEntry[] = [];
    for (const p of players) {
      const rec = p as {
        fullName?: string;
        defaultPositionId?: number;
        ranks?: { overall?: number | string };
        ownership?: { averageDraftPosition?: number | string; percentOwned?: number | string };
      };

      if (!rec.fullName || !rec.defaultPositionId) continue;
      const pos = ESPN_POS[rec.defaultPositionId];
      if (!pos || pos === "K" || pos === "DEF") continue;

      const rankRaw = rec.ranks?.overall;
      let rank: number | null = null;
      if (typeof rankRaw === "number") rank = rankRaw;
      else if (typeof rankRaw === "string" && rankRaw !== "") rank = Number(rankRaw);

      const adpRaw = rec.ownership?.averageDraftPosition;
      let adp: number | null = null;
      if (typeof adpRaw === "number") adp = adpRaw;
      else if (typeof adpRaw === "string" && adpRaw !== "") adp = Number(adpRaw);

      const ownedRaw = rec.ownership?.percentOwned;
      const percentOwned =
        typeof ownedRaw === "number" ? ownedRaw : typeof ownedRaw === "string" ? Number(ownedRaw) : null;

      if (rank === null && adp === null && percentOwned === null) continue;

      entries.push({
        name: normalizeName(rec.fullName),
        position: pos,
        rank,
        adp,
        percentOwned,
      });
    }
    return entries;
  } catch {
    // Network error, empty response, or changed schema: degrade gracefully.
    return [];
  }
}
