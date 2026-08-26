# DraftIQ — Project Handoff / Context

> This file is the single source of truth for continuing work on **DraftIQ**. Read this
> first before touching anything. It was written to survive a chat/context reset.

## TL;DR — what this is
A **mobile-first, installable (PWA) fantasy football draft assistant** called **DraftIQ**.
One person uses it to track their own draft and get "who should I pick next?" advice.
Everything is **saved on the user's device** (localStorage) — no accounts, no backend
database, no auth for the core features.

- **Live URL:** `https://draft-iq-six.vercel.app` (Vercel, auto-deploys on push to `main`)
- **Repo:** `https://github.com/steveharageones-oss/DraftIQ` (public, branch `main`)
- **Owner (the human):** has **1 ESPN league + 2 Yahoo leagues** (full-PPR-ish, ESPN=2 FLEX, Yahoo=3 FLEX).

## Tech stack
- **Next.js 16.3.2** (App Router) + **React 19** + **TypeScript**, **Tailwind CSS v4**.
- Package manager **pnpm** (v11); project name in package.json is `ff-draft-assistant`.
- ⚠️ **Next 16 has breaking changes.** The repo has an `AGENTS.md` (and `CLAUDE.md` → `@AGENTS.md`)
  that tells you to read `node_modules/next/dist/docs/` before writing Next code. The Next
  package resolves at `node_modules/.pnpm/next@16.3.2_*/node_modules/next` (pnpm layout).

## How to run / build
```bash
pnpm install          # if needed
pnpm dev              # local dev → http://localhost:3000
pnpm build            # production build + type-check
pnpm start            # serve the production build
pnpm import:rankings  # re-pull FantasyPros PPR rankings into src/data/rankings.json
```
> **Windows gotcha:** building sometimes fails with `EPERM: unlink ... .next\...` due to a
> stale `.next` file lock. Fix: `Remove-Item -Recurse -Force .next` then rebuild. Do this
> before every build to be safe.

## Architecture / key files (all under `src/`)
- `lib/types.ts` — shared domain types (`BoardPlayer`, `SleeperPlayer`, `ScoringSettings`,
  `RosterSlotCounts`, `Recommendation`, `AdviceRequest`). `FantasyPosition` includes `DEF`/`K`.
- `lib/sleeper.ts` — fetches Sleeper's live player pool (no key). **Caches the compact normalized
  list in-process** (Sleeper's raw payload is ~19MB, above Next's 2MB fetch cache). `FANTASY_SAFE`
  maps QB/RB/WR/TE/K/DEF; drops non-fantasy positions and `active===false`.
- `lib/espn.ts` — `RankedEntry` type + `normalizeName()` (strips `Jr./Sr./II/III/IV/V.` and
  non-alphanumerics). ESPN rankings client is **best-effort only** (its free endpoint returns
  waiver data; not used in practice).
- `lib/customRankings.ts` — loads `src/data/rankings.json` → `RankedEntry[]`. **Maps FantasyPros
  `"DST"` → `"DEF"`.** Carries `team` (for defense matching) and `page` (FantasyPros player-page
  slug, for the info card).
- `lib/rankings.ts` — `buildBoard()`. Board order = the injected expert rankings (FantasyPros PPR),
  joined to Sleeper by **name+position** (and **by team** for DEF). Value = a 0–100 curve that
  decreases with overall rank. Unranked players get a low floor. **No position multiplier / scarcity
  re-ordering** (that was a bug; order must follow consensus exactly).
- `lib/board.ts` — `loadBoard()`: prefers `custom` (FantasyPros) rankings, falls back to ESPN, else
  builtin tiers. Sets `source` = `"custom" | "espn" | "builtin"`.
- `lib/advice.ts` — the "Suggest my next pick" engine. `analyzeRoster()` computes positional needs
  vs per-league slots; `scoreAvailable()` = value × need-factor. `filterAvailable()` **excludes K and
  DEF** unless nothing else is left (so it doesn't suggest a kicker early). `generateAdvice()` uses
  the **LLM if `AI_API_KEY` is set**, else the builtin heuristic (always works).
- `lib/ai/llm.ts` — optional OpenAI-compatible `/chat/completions` hook (env `AI_API_KEY`,
  `AI_MODEL`, `AI_BASE_URL`). Not used unless configured.
- `lib/leagues.ts` — **multi-league model + `useLeagues()` hook.** `League` = { id, name, platform
  (manual|espn|yahoo), externalId, season, draftState {draftedIds, otherTakenIds}, slots, ppr }.
  Persists to localStorage (`draftiq.leagues`, `draftiq.activeLeagueId`). Normalizes old leagues
  missing `slots`/`ppr`.
- `lib/lineup.ts` — `buildLineup()` → starting lineup (QB/RB/WR/TE/**FLEX[]**/bench). Supports
  **multiple FLEX** (returns an array). `isLineupComplete()`.
- `lib/status.ts` — `injuryInfo()` → injury badge: **Out** (IR/Injured Reserve/PUP/Suspended) vs
  **Questionable** (Q, amber) vs **Doubtful** (D, orange). Maps Sleeper `injury_status` + `status`.
- `lib/fantasyPros.ts` — `scrapeFantasyProsPlayer(page)` → player page "outlook strip" (ECR/ADP/
  Best-Worst/Rostered) + the **"Expert Note"** outlook paragraph (free scrape, cached 1h).
- `lib/yahoo.ts` — **Yahoo OAuth 2.0** helpers (`buildAuthUrl`, `exchangeCodeForToken`,
  `fetchYahooLeagues`). Uses env `YAHOO_CLIENT_ID/SECRET/REDIRECT_URI`, scope `fspt-w`. ⚠️ See
  "Yahoo/ESPN auto-import" below — **this is effectively dead.**

### API routes (`src/app/api/`)
- `players/route.ts` — `GET /api/players` → ranked board (Sleeper + FantasyPros). Returns
  `{ board, source, total }`.
- `advice/route.ts` — `POST /api/advice` → `{ recommendation }`. Body: `draftedPlayerIds`,
  `unavailablePlayerIds`, `slots`, `scoring`.
- `player/route.ts` — `GET /api/player?page=<slug>` → scraped player info (ECR/ADP/Best-Worst/
  outlook). Guards the slug.
- `yahoo/auth|callback|leagues/route.ts` — Yahoo OAuth flow + league list (currently unused/blocked).

### UI (`src/components/`)
- `AppShell.tsx` — **league switcher + add/rename + Yahoo connect card + settings (roster slots +
  PPR) + reset/delete**. Renders `DraftApp` keyed by league id + a reset nonce. Has the "Yahoo"
  connect block (which currently shows "Failed — scope may be blocked").
- `DraftApp.tsx` — the main board. Fetches `/api/players`, tracks `draftedIds`/`otherTakenIds`
  (seeded from `league.draftState`, persisted via `onStateChange`), position filter tabs
  (ALL/QB/RB/WR/TE/K/DST), **search box**, advice panel, "taken by others" list, player card.
- `PlayerRow.tsx` — board row: rank, name (tappable → opens card), injury badge, value, `⊘` (taken)
  and `+` (pick) buttons.
- `MyTeam.tsx` — lineup (QB/RB/WR/TE/FLEX×N/bench), with remove.
- `AdvicePanel.tsx` — recommendation card.
- `PlayerCardModal.tsx` — player info card. **Rendered via `createPortal(..., document.body)`** and
  uses an **overlay that scrolls + a `position: sticky` header** (name/status pinned) — this fixed
  mobile clipping/scroll issues. Fetches `/api/player?page=...` for outlook.
- `ShareButton.tsx` — Share with **QR code** (uses `qrcode.react`), also **portaled to body**
  (fixes it being trapped behind the sticky/backdrop-blur header).
- `pwa/ServiceWorkerRegister.tsx` — registers `/sw.js`.

### PWA
- `src/app/manifest.ts` (web manifest), `public/sw.js` (app-shell cache), `public/icon-*.png`.
- `layout.tsx` sets metadata + viewport; `page.tsx` renders header (with `ShareButton`) + `AppShell`.

## Data sources — what works, what's blocked (IMPORTANT)
- ✅ **Sleeper** (`/v1/players/nfl`) — real player pool + team/status/injury/age. No key. Used for
  identity + health. Its **stats/projections endpoints return EMPTY** (no usable stat lines).
- ✅ **FantasyPros (scrape)** — the **PPR consensus rankings** are scraped into
  `src/data/rankings.json` (re-run `pnpm import:rankings`; transient `ECONNRESET` happens — retry).
  Player **pages** are scraped on-demand for the outlook card. Free, but fragile (could break if
  FantasyPros changes markup).
- ❌ **Yahoo** — **auto-import is dead.** Yahoo's OAuth 2.0 app creation only offers OpenID/TW
  Auction scopes (no Fantasy Sports); OAuth 1.0a apps aren't offered to new users; requesting
  `scope=fspt-w` in the OAuth URL leads to Yahoo rejecting it ("Uh oh" / "specify a valid request" /
  our app's "Failed — scope may be blocked"). This was tested end-to-end and confirmed a platform
  restriction. (Yahoo env vars may still be set on Vercel; the secret was pasted in chat and should
  ideally be **regenerated/removed**.)
- ❌ **ESPN** — the user's ESPN league is **private** (needs `ESPN_S2` + `SWID` session cookies);
  free public endpoints return waiver-only or 403/404. Not pursued.
- ⚠️ **Clean last-season stat lines** aren't available for free anywhere we tested. Paid
  **FantasyPros API (~$8.99/mo)** would give real stats + projections.

## Key decisions already made (don't re-litigate)
1. **Manual tracking for all 3 leagues** (user taps `+`/`⊘`). Auto-import was attempted and is
   blocked (Yahoo) / private (ESPN). The user is fine with manual.
2. Board ordering = **FantasyPros PPR consensus** (source of truth), not Sleeper (no ADP) or the
   old hand-written `src/data/baseRankings.ts` (still a last-resort fallback for unranked players).
3. **No AI key needed** — the builtin heuristic is good enough; an LLM would only change *wording*,
   not the pick (same underlying data). The user agreed it's not worth it. (Optional envs exist.)
4. **Free scrape over paid API** for the player outlook card (user chose free; aware it's fragile).
5. No custom domain yet (still `draft-iq-six.vercel.app`). No shared live room yet.

## Open / possible next steps (user's backlog)
- **Shared manual live room** — "Create room → share link → everyone on one board → picks sync."
  Needs a backend + small DB (free tiers: Upstash/Supabase). No OAuth. This is the "friends draft
  together" feature. **Not yet built.**
- **Tampermonkey userscript** to auto-track the live Yahoo draft (runs on the Yahoo draft page in
  the user's logged-in browser, pushes picks to DraftIQ). Discussed as the realistic "auto" option;
  fragile, Yahoo-specific, not started.
- **Custom domain** (~$10/yr) for a cleaner link.
- **AI key** or **FantasyPros paid API** for richer advice / deep stats (only if user wants).
- **"Last season" stat line** in the player card (needs a stats source; currently shows outlook only).

## Environment variables
Set on **Vercel → Project → Settings → Environment Variables** (production):
- `YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET`, `YAHOO_REDIRECT_URI` (= `https://draft-iq-six.vercel.app/api/yahoo/callback`) — for the (dead) Yahoo OAuth. Secret value should be rotated/removed.
- Optional: `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` (OpenAI-compatible LLM upgrade; unused).
- There is also a `.env.example` documenting these.

## Deploy model
- Push to `main` → Vercel auto-deploys. After pushing, wait ~1–2 min, then **hard-refresh** the live
  URL (the user has been burned by caching several times).
- GitHub CLI is authenticated as `steveharageones-oss` in the working environment, if repo actions
  are needed.

## Non-obvious gotchas (read this!)
- **`.next` EPERM lock** on Windows before build → remove `.next` first.
- **React modal stacking:** elements inside the sticky/`backdrop-blur` header get a containing block,
  so `position: fixed` breaks. Solution used: render modals via `createPortal(..., document.body)`.
- **Flex scroll:** a flex child needs `min-h-0` to actually scroll; the player card uses an
  overlay-scroll + `position: sticky` header instead (more robust on mobile).
- **Name normalization** must be identical on both sides of a join (FantasyPros name vs Sleeper
  name). `normalizeName()` strips suffixes + punctuation. Defenses (DST→DEF) match by **team**, not name.
- **Sleeper PowerShell pitfall:** piping `Invoke-RestMethod`'s result (a PSCustomObject dictionary)
  enumerates the object, not its values. To iterate players, use `$players.PSObject.Properties | ForEach-Object { $_.Value }`.
- The board's `/api/players` response is large (~3000 players). It's fine, but don't over-fetch.
