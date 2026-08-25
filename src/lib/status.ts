export type InjuryTone = "out" | "q" | "doubtful" | "none";

export interface InjuryInfo {
  label: string | null;
  tone: InjuryTone;
  part: string | null; // injury body part, when known
}

// Statuses that mean a player is (effectively) not playing.
const OUT_STATUSES = new Set([
  "ir",
  "injured reserve",
  "injured_reserve",
  "pup",
  "sus",
  "suspended",
  "out",
]);

/**
 * Map a Sleeper player's health fields to a concise injury badge.
 * - Out / IR / PUP / Suspended  -> "Out" (red)
 * - Doubtful                   -> "D" (orange)
 * - Questionable / DNR         -> "Q" (amber)
 * - Active / NA / empty        -> no badge
 */
export function injuryInfo(player: {
  status?: string | null;
  injury_status?: string | null;
  injury_body_part?: string | null;
}): InjuryInfo {
  const istatus = (player.injury_status ?? "").trim().toLowerCase();
  const status = (player.status ?? "").trim().toLowerCase();
  const part = player.injury_body_part ?? null;

  if (OUT_STATUSES.has(istatus) || status === "injured reserve") {
    return { label: "Out", tone: "out", part };
  }
  if (istatus === "doubtful") return { label: "Doubtful", tone: "doubtful", part };
  if (istatus === "questionable") return { label: "Questionable", tone: "q", part };
  if (istatus === "dnr") return { label: "Questionable", tone: "q", part };

  return { label: null, tone: "none", part };
}
