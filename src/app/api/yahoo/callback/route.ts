import { NextRequest, NextResponse } from "next/server";
import { isYahooConfigured, exchangeCodeForToken } from "@/lib/yahoo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const dest = () => {
    const u = new URL("/", request.url);
    return u;
  };

  if (!isYahooConfigured()) {
    const u = dest();
    u.searchParams.set("yahoo", "error");
    return NextResponse.redirect(u);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    const u = dest();
    u.searchParams.set("yahoo", "error");
    return NextResponse.redirect(u);
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const u = dest();
    u.searchParams.set("yahoo", "connected");
    const res = NextResponse.redirect(u);
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set("yahoo_access", tokens.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/api/yahoo",
      maxAge: tokens.expires_in,
    });
    res.cookies.set("yahoo_refresh", tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/api/yahoo",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    const u = dest();
    u.searchParams.set("yahoo", "error");
    return NextResponse.redirect(u);
  }
}
