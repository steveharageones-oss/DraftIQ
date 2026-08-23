import type { FantasyPosition } from "../lib/types";

/**
 * Curated expert tier baseline (a shipped snapshot of consensus draggability).
 *
 * This is a defensible *starting* board used by the built-in engine when no
 * external ranking source (e.g. live ESPN ADP) is available. It is keyed by
 * normalized player name and joined against Sleeper's live pool, so every
 * entry carries real player identity, team, and health from Sleeper.
 *
 * Tiers: 1 = elite round (highest value) ... 6 = late-round value.
 * Can be refreshed/replaced by wiring a live ADP feed into `rankings.ts`.
 */

export interface TierSeed {
  name: string;
  position: FantasyPosition;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
}

const t = (name: string, position: FantasyPosition, tier: 1 | 2 | 3 | 4 | 5 | 6): TierSeed => ({
  name,
  position,
  tier,
});

export const EXPERT_TIERS: TierSeed[] = [
  // Tier 1 — league-winning floor (RB/WR heavy)
  t("Christian McCaffrey", "RB", 1),
  t("Bijan Robinson", "RB", 1),
  t("Jahmyr Gibbs", "RB", 1),
  t("CeeDee Lamb", "WR", 1),
  t("Justin Jefferson", "WR", 1),
  t("Ja'Marr Chase", "WR", 1),
  t("Amon-Ra St. Brown", "WR", 1),
  t("Breece Hall", "RB", 1),
  t("Jonathan Taylor", "RB", 1),
  t("Saquon Barkley", "RB", 1),
  // Tier 2
  t("Travis Kelce", "TE", 2),
  t("Tyreek Hill", "WR", 2),
  t("A.J. Brown", "WR", 2),
  t("Puka Nacua", "WR", 2),
  t("Garrett Wilson", "WR", 2),
  t("Derrick Henry", "RB", 2),
  t("Josh Jacobs", "RB", 2),
  t("Isiah Pacheco", "RB", 2),
  t("Kyren Williams", "RB", 2),
  t("De'Von Achane", "RB", 2),
  // Tier 3
  t("Sam LaPorta", "TE", 3),
  t("Mark Andrews", "TE", 3),
  t("Trey McBride", "TE", 3),
  t("Davante Adams", "WR", 3),
  t("Mike Evans", "WR", 3),
  t("D.K. Metcalf", "WR", 3),
  t("Deebo Samuel", "WR", 3),
  t("Marvin Harrison Jr.", "WR", 3),
  t("Malik Nabers", "WR", 3),
  t("Travis Etienne", "RB", 3),
  t("Joe Mixon", "RB", 3),
  t("Rachaad White", "RB", 3),
  t("James Cook", "RB", 3),
  t("Josh Allen", "QB", 3),
  t("Patrick Mahomes", "QB", 3),
  // Tier 4
  t("George Kittle", "TE", 4),
  t("Jalen Hurts", "QB", 4),
  t("Lamar Jackson", "QB", 4),
  t("C.J. Stroud", "QB", 4),
  t("Joe Burrow", "QB", 4),
  t("Stefon Diggs", "WR", 4),
  t("Amari Cooper", "WR", 4),
  t("Chris Olave", "WR", 4),
  t("DeVonta Smith", "WR", 4),
  t("Keenan Allen", "WR", 4),
  t("Tank Dell", "WR", 4),
  t("Rashee Rice", "WR", 4),
  t("Najee Harris", "RB", 4),
  t("Kenneth Walker", "RB", 4),
  t("Zay Flowers", "WR", 4),
  // Tier 5
  t("Nico Collins", "WR", 5),
  t("Jaylen Waddle", "WR", 5),
  t("Courtland Sutton", "WR", 5),
  t("Tee Higgins", "WR", 5),
  t("Michael Pittman Jr.", "WR", 5),
  t("Brandon Aiyuk", "WR", 5),
  t("Drake London", "WR", 5),
  t("Terry McLaurin", "WR", 5),
  t("Alvin Kamara", "RB", 5),
  t("Rhamondre Stevenson", "RB", 5),
  t("Javonte Williams", "RB", 5),
  t("Ezekiel Elliott", "RB", 5),
  t("Aaron Jones", "RB", 5),
  t("Evan Engram", "TE", 5),
  t("Dallas Goedert", "TE", 5),
  t("Jake Ferguson", "TE", 5),
  // Tier 6 — late-round / bench value
  t("Dak Prescott", "QB", 6),
  t("Kirk Cousins", "QB", 6),
  t("Brock Purdy", "QB", 6),
  t("Tua Tagovailoa", "QB", 6),
  t("Jordan Love", "QB", 6),
  t("Anthony Richardson", "QB", 6),
  t("DeAndre Hopkins", "WR", 6),
  t("Tyler Lockett", "WR", 6),
  t("Christian Kirk", "WR", 6),
  t("Rashid Shaheed", "WR", 6),
  t("Curtis Samuel", "WR", 6),
  t("Jaxon Smith-Njigba", "WR", 6),
  t("D'Andre Swift", "RB", 6),
  t("Austin Ekeler", "RB", 6),
  t("Zack Moss", "RB", 6),
  t("Tyjae Spears", "RB", 6),
  t("Jaylen Warren", "RB", 6),
  t("David Njoku", "TE", 6),
  t("Dalton Schultz", "TE", 6),
  t("Pat Freiermuth", "TE", 6),
];

/** Tier index -> baseline full-PPR value (0-100). */
export const TIER_BASE: Record<1 | 2 | 3 | 4 | 5 | 6, number> = {
  1: 95,
  2: 86,
  3: 78,
  4: 70,
  5: 62,
  6: 55,
};

/** Position multipliers that reflect full-PPR scoring (WR up, RB down, QB/TE down). */
export const POSITION_MULT: Record<FantasyPosition, number> = {
  QB: 0.9,
  RB: 1.0,
  WR: 1.04,
  TE: 0.97,
  FLEX: 1.0,
  DEF: 0.7,
  K: 0.65,
};
