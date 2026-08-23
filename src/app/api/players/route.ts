import { NextRequest } from "next/server";
import { loadBoard } from "@/lib/board";
import type { FantasyPosition } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const positionsParam = request.nextUrl.searchParams.get("positions");
  const positions = (positionsParam ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is FantasyPosition => ["QB", "RB", "WR", "TE"].includes(s));

  try {
    const { board, source, total } = await loadBoard({ positions });
    return Response.json({
      board,
      source,
      total,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { error: "Couldn't load player data right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
