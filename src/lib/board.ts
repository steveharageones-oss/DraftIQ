import type { BoardPlayer, FantasyPosition, ScoringSettings } from "./types";
import { DEFAULT_SCORING } from "./types";
import { fetchSleeperPlayers } from "./sleeper";
import { fetchEspnRankings, type RankedEntry } from "./espn";
import { getCustomRankings } from "./customRankings";
import { buildBoard, filterBoardForPositions } from "./rankings";

type RankSource = "builtin" | "espn" | "custom";

export interface BoardResult {
  board: BoardPlayer[];
  source: RankSource;
  total: number;
}

/**
 * Build the board using the ingested FantasyPros consensus rankings (the
 * authoritative source), falling back to ESPN when that file is empty.
 */
async function fetchBoard(scoring: ScoringSettings = DEFAULT_SCORING): Promise<BoardPlayer[]> {
  const players = await fetchSleeperPlayers();

  const custom = getCustomRankings();
  if (custom.length > 0) {
    return buildBoard(players, custom, scoring, "custom");
  }

  const espn = await fetchEspnRankings();
  return buildBoard(players, espn, scoring, "espn");
}

export async function loadBoard(
  opts: {
    positions?: FantasyPosition[];
    scoring?: ScoringSettings;
  } = {},
): Promise<BoardResult> {
  const scoring = opts.scoring ?? DEFAULT_SCORING;
  const board = await fetchBoard(scoring);
  const filtered = filterBoardForPositions(board, opts.positions ?? []);
  const source: RankSource = board.some((p) => p.source === "custom")
    ? "custom"
    : board.some((p) => p.source === "espn")
      ? "espn"
      : "builtin";
  return { board: filtered, source, total: filtered.length };
}

/** Ranked entries loader used for type clarity in tests/tooling. */
export type { RankedEntry };
