import { NextRequest } from "next/server";
import { loadBoard } from "@/lib/board";
import { generateAdvice } from "@/lib/advice";
import type { RosterSlotCounts, ScoringSettings } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rec = body as {
    draftedPlayerIds?: unknown;
    unavailablePlayerIds?: unknown;
    scoring?: unknown;
    slots?: unknown;
    leagueSize?: unknown;
  };

  const draftedPlayerIds = Array.isArray(rec.draftedPlayerIds)
    ? rec.draftedPlayerIds.map((x) => String(x)).filter(Boolean)
    : [];

  const unavailablePlayerIds = Array.isArray(rec.unavailablePlayerIds)
    ? rec.unavailablePlayerIds.map((x) => String(x)).filter(Boolean)
    : undefined;

  if (draftedPlayerIds.length === 0) {
    return Response.json(
      { error: "draftedPlayerIds is required." },
      { status: 400 },
    );
  }

  try {
    const { board } = await loadBoard();
    const recommendation = await generateAdvice(board, {
      draftedPlayerIds,
      unavailablePlayerIds,
      scoring: (rec.scoring ?? undefined) as Partial<ScoringSettings> | undefined,
      slots: (rec.slots ?? undefined) as Partial<RosterSlotCounts> | undefined,
      leagueSize: typeof rec.leagueSize === "number" ? rec.leagueSize : undefined,
    });
    return Response.json({ recommendation }, { status: 200 });
  } catch {
    return Response.json(
      { error: "Couldn't compute a recommendation right now. Please try again." },
      { status: 502 },
    );
  }
}
