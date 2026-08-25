// Shared domain types for the FF Draft Assistant.

export type FantasyPosition = "QB" | "RB" | "WR" | "TE" | "FLEX" | "DEF" | "K";

/** A player from Sleeper's live NFL roster (only the fields we care about). */
export interface SleeperPlayer {
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string; // Sleeper's single position (RB, WR, QB, TE, ...)
  fantasy_positions: string[]; // e.g. ["RB"] or ["WR", "RB"]
  team: string | null;
  status: string | null; // Active, Questionable, Out, Injured Reserve, ...
  injury_status: string | null;
  injury_body_part: string | null;
  age: number | null;
  years_exp: number | null;
  search_rank?: number | null;
}

/**
 * A ranked board entry: the Sleeper identity/enriched with a computed
 * full-PPR draft value and an expert rank (ADP) when available.
 */
export interface BoardPlayer {
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: FantasyPosition; // primary fantasy position we score them at
  positions: FantasyPosition[]; // all eligible positions
  team: string | null;
  status: string | null;
  injury_status: string | null;
  injury_body_part: string | null;
  age: number | null;
  years_exp: number | null;
  /** 0-100 full-PPR draft value. Higher = better. */
  value: number;
  /** Overall board rank (1 = best). */
  rank: number;
  /** Expert ADP if a provider supplied it, else null. */
  adp: number | null;
  /** FantasyPros player-page slug (e.g. "james-cook.php"), for the info card. */
  page?: string | null;
  /** Source that produced this ordering/value: "builtin" | "espn" | "custom". */
  source: "builtin" | "espn" | "custom";
}

export interface ScoringSettings {
  ppr: number; // points per reception (1.0 for full PPR)
  passingTd: number;
  perThrowYds: number;
  perRushYds: number;
  perRecYds: number;
}

/** How many of each slot a league starts (auto-flex counts toward FLEX). */
export interface RosterSlotCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
}

export const DEFAULT_SCORING: ScoringSettings = {
  ppr: 1.0,
  passingTd: 4,
  perThrowYds: 0.04,
  perRushYds: 0.1,
  perRecYds: 0.1,
};

// Typical full-PPR starting lineup (2 RB / 2 WR / 1 TE / 1 FLEX).
export const DEFAULT_ROSTER_SLOTS: RosterSlotCounts = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
};

export interface RosterState {
  draftedPlayerIds: string[];
  slots?: Partial<RosterSlotCounts>;
}

export interface AdviceRequest {
  draftedPlayerIds: string[];
  /** Players that are no longer available (your picks + others' picks). */
  unavailablePlayerIds?: string[];
  scoring?: Partial<ScoringSettings>;
  slots?: Partial<RosterSlotCounts>;
  leagueSize?: number;
}

export interface Recommendation {
  player: BoardPlayer;
  reason: string;
  fit: string; // positional fit explanation
  alternatives: BoardPlayer[];
  notes: string[];
  engine: "builtin" | "llm";
}
