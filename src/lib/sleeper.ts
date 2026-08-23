import type { SleeperPlayer, FantasyPosition } from "./types";

const SLEEPER_API = "https://api.sleeper.app";
const SLEEPER_PLAYERS_URL = `${SLEEPER_API}/v1/players/nfl`;

const FANTASY_SAFE: Record<string, FantasyPosition> = {
  QB: "QB",
  RB: "RB",
  WR: "WR",
  TE: "TE",
};

/**
 * Fetch Sleeper's live NFL player pool. Server-side only (no key required).
 *
 * The raw payload is ~19MB, far above Next's 2MB fetch-cache limit, so we
 * cache the compact *normalized* list in-process (per serverless instance)
 * for a few minutes. This keeps injury/team changes reasonably fresh without
 * refetching the huge payload on every request.
 */
let playerCache: { data: SleeperPlayer[]; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchSleeperPlayers(): Promise<SleeperPlayer[]> {
  const now = Date.now();
  if (playerCache && now - playerCache.ts < CACHE_TTL_MS) {
    return playerCache.data;
  }

  const res = await fetch(SLEEPER_PLAYERS_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Sleeper players request failed: ${res.status}`);
  }

  const raw: Record<string, Record<string, unknown>> = await res.json();
  const players: SleeperPlayer[] = Object.values(raw)
    .map((p) => normalizePlayer(p))
    .filter((p): p is SleeperPlayer => p !== null);

  playerCache = { data: players, ts: now };
  return players;
}

function normalizePlayer(p: Record<string, unknown>): SleeperPlayer | null {
  const position = String(p.position ?? "");
  const fantasy = Array.isArray(p.fantasy_positions)
    ? p.fantasy_positions.map((x) => String(x))
    : [];

  // Only fantasy-relevant positions, and drop aged-out inactive players.
  if (!(position in FANTASY_SAFE)) return null;
  if (p.active === false) return null;

  const player = p as unknown as SleeperPlayer & { active?: boolean };
  return {
    player_id: String(p.player_id ?? ""),
    full_name: String(p.full_name ?? ""),
    first_name: String(p.first_name ?? ""),
    last_name: String(p.last_name ?? ""),
    position,
    fantasy_positions: fantasy,
    team: (p.team as string | null) ?? null,
    status: (p.status as string | null) ?? null,
    injury_status: (p.injury_status as string | null) ?? null,
    injury_body_part: (p.injury_body_part as string | null) ?? null,
    age: typeof p.age === "number" ? p.age : null,
    years_exp: typeof p.years_exp === "number" ? p.years_exp : null,
    search_rank:
      typeof p.search_rank === "number" ? p.search_rank : null,
  };
}

/** Primary scoring position for a player (takes the strongest fantasy slot). */
export function primaryPosition(player: SleeperPlayer): FantasyPosition {
  const order: FantasyPosition[] = ["RB", "WR", "TE", "QB"];
  const eligible = playerEligiblePositions(player);
  for (const pos of order) {
    if (eligible.includes(pos)) return pos;
  }
  return player.position as FantasyPosition;
}

export function playerEligiblePositions(player: SleeperPlayer): FantasyPosition[] {
  const positions = new Set<FantasyPosition>();
  const add = (p: string | undefined) => {
    const mapped = p ? FANTASY_SAFE[p] : undefined;
    if (mapped) positions.add(mapped);
  };
  add(player.position);
  for (const fp of player.fantasy_positions) add(fp);
  if (positions.size === 0) add(player.position);
  return [...positions];
}
