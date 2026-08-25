import { NextRequest, NextResponse } from "next/server";
import { fetchYahooLeagues, type YahooLeague } from "@/lib/yahoo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const access = request.cookies.get("yahoo_access")?.value;
  if (!access) {
    return NextResponse.json({ error: "Not connected to Yahoo yet." }, { status: 401 });
  }
  try {
    const leagues = await fetchYahooLeagues(access);
    return NextResponse.json({ leagues: leagues satisfies YahooLeague[] }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Couldn't load your Yahoo leagues. (If the scope was rejected, this is the Yahoo restriction.)" },
      { status: 502 },
    );
  }
}
