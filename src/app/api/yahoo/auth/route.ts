import { NextRequest, NextResponse } from "next/server";
import { isYahooConfigured, buildAuthUrl } from "@/lib/yahoo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isYahooConfigured()) {
    return NextResponse.json(
      { error: "Yahoo is not configured (missing YAHOO_CLIENT_ID / SECRET / REDIRECT_URI)." },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();
  const url = buildAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("yahoo_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/yahoo",
  });
  return res;
}
