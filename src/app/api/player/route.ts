import { NextRequest } from "next/server";
import { scrapeFantasyProsPlayer } from "@/lib/fantasyPros";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page");
  if (!page) {
    return Response.json({ error: "page is required." }, { status: 400 });
  }
  // Guard against path tricks.
  const safe = page.replace(/[^a-zA-Z0-9_.-]/g, "");
  if (!safe) {
    return Response.json({ error: "Invalid page." }, { status: 400 });
  }

  const info = await scrapeFantasyProsPlayer(safe);
  if (!info) {
    return Response.json(
      { error: "Couldn't load player info from FantasyPros right now." },
      { status: 502 },
    );
  }
  return Response.json({ ok: true, ...info }, { status: 200 });
}
