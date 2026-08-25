const AUTHORIZE_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const FANTASY_SCOPE = "fspt-w";
const API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

interface YahooEnv {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

function env(): YahooEnv {
  return {
    clientId: process.env.YAHOO_CLIENT_ID,
    clientSecret: process.env.YAHOO_CLIENT_SECRET,
    redirectUri: process.env.YAHOO_REDIRECT_URI,
  };
}

export function isYahooConfigured(): boolean {
  const e = env();
  return Boolean(e.clientId && e.clientSecret && e.redirectUri);
}

export function buildAuthUrl(state: string): string {
  const e = env();
  const params = new URLSearchParams({
    client_id: e.clientId ?? "",
    redirect_uri: e.redirectUri ?? "",
    response_type: "code",
    scope: FANTASY_SCOPE,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface YahooTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function exchangeCodeForToken(code: string): Promise<YahooTokens> {
  const e = env();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: e.redirectUri ?? "",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${e.clientId}:${e.clientSecret}`).toString("base64")}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo token exchange failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  return {
    access_token: String(data.access_token),
    refresh_token: String(data.refresh_token ?? ""),
    expires_in: Number(data.expires_in ?? 3600),
  };
}

export interface YahooLeague {
  key: string;
  id: string;
  name: string;
}

// Yahoo fantasy_content uses arrays of [count, ...items]; drop the leading count.
function items<T>(node: unknown): T[] {
  return Array.isArray(node) ? (node as T[]).slice(1) : [];
}

export async function fetchYahooLeagues(accessToken: string): Promise<YahooLeague[]> {
  const res = await fetch(
    `${API_BASE}/users;use_login=1/games;game_keys=nfl/leagues.json`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    },
  );
  if (!res.ok) {
    throw new Error(`Yahoo leagues fetch failed (${res.status})`);
  }
  const data = (await res.json()) as { fantasy_content: Record<string, unknown> };
  const fc = data.fantasy_content;

  const users = items(fc.users);
  const userObj = users.find((u) => (u as Record<string, unknown>).user) as
    | Record<string, unknown>
    | undefined;
  const user = userObj ? items(userObj.user) : [];
  const gamesObj = user.find((u) => (u as Record<string, unknown>).games) as
    | Record<string, unknown>
    | undefined;
  const games = gamesObj ? items(gamesObj.games) : [];
  const gameObj = games.find((g) => (g as Record<string, unknown>).game) as
    | Record<string, unknown>
    | undefined;
  const game = gameObj ? items(gameObj.game) : [];
  const leaguesObj = game.find((g) => (g as Record<string, unknown>).leagues) as
    | Record<string, unknown>
    | undefined;
  const leaguesArr = leaguesObj ? items<Record<string, unknown>>(leaguesObj.leagues) : [];

  const out: YahooLeague[] = [];
  for (const entry of leaguesArr) {
    const league = items<Record<string, unknown>>((entry as Record<string, unknown>).league);
    const meta = league.find((l) => l.league_id);
    if (meta && typeof meta.league_key === "string") {
      out.push({
        key: String(meta.league_key),
        id: String(meta.league_id),
        name: String(meta.name ?? "Yahoo League"),
      });
    }
  }
  return out;
}
