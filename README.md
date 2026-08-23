# DraftIQ — Fantasy Football Draft Assistant

A **mobile-first, installable web app (PWA)** to share with your friends. It pulls a
real, live player board and gives **AI-style draft advice** — "who should I pick next?"
— tuned for a **full-PPR** league.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS**, using Sleeper's free
public API for the player pool and a built-in value engine. It runs **with zero API keys**,
so you can deploy once and hand friends a link.

> **Live demo note:** the board and advice only need internet (to reach Sleeper). Nothing
> is required to set up before sharing.

---

## Features (MVP)

- **Live draft board** — real NFL players (name, position, team, age, injury/status) from
  [Sleeper's public API](https://docs.sleeper.com/), ranked by a full-PPR value model.
- **Suggest my next pick** — the engine weighs your current roster against the remaining
  board and tells you the best player to draft, with the *reason*, positional fit, a few
  *alternatives*, and any injury caveats.
- **Mobile-first, installable PWA** — add to the home screen, standalone display, offline
  app shell.
- **My Team, live** — tap `+` to draft and see your actual starting lineup (1 QB / 2 RB /
  2 WR / 1 TE / 1 FLEX) plus your bench, and remove picks with one tap.
- **Mark players taken** — tap `⊘` when another team drafts someone and they drop off the
  board automatically; view and undo them anytime.
- **Position filter tabs** (QB / RB / WR / TE) to focus the board.
- **Manage multiple leagues** — add and switch between several leagues (ESPN, Yahoo, or
  Manual), each with its own board, My Team, and taken list. Everything is **saved on your
  device** (localStorage), so it persists between visits with no accounts or backend.
- **Zero required config** — works out of the box. Optional upgrades below.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- PWA via `manifest.ts` + a minimal service worker (`public/sw.js`)
- Sleeper public API: `https://api.sleeper.app/v1/players/nfl` (no key)
- Optional LLM hook (OpenAI-compatible) for richer reasoning

---

## Getting started (local dev)

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The board loads from Sleeper automatically.

Production build & run:

```bash
pnpm build
pnpm start
```

---

## Configuration

Everything works with **no keys**. These are optional upgrades (see `.env.example`):

| Variable       | Purpose                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `AI_API_KEY`   | Enables an LLM-backed "suggest my next pick" (richer, more conversational reasoning).                |
| `AI_MODEL`     | Model id for the chat-completions call (default `gpt-4o-mini`).                                      |
| `AI_BASE_URL`  | OpenAI-compatible base URL (default `https://api.openai.com/v1`). Swap to Groq/OpenRouter/etc.        |

Copy `.env.example` to `.env.local` to customize.

### Refresh the rankings
The board order comes from an ingested **FantasyPros PPR consensus** snapshot
(`src/data/rankings.json`). To pull the latest:

```bash
pnpm import:rankings            # default: FantasyPros PPR cheatsheet
# or point at another FantasyPros page:
node scripts/import-rankings.mjs "https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php"
```

---

## How the draft board & advice work

1. The server calls Sleeper's player pool (real, live, cached ~5 min) to get the player
   identity, positions, team, and health status.
2. The board order is taken **directly from the ingested FantasyPros PPR consensus**
   (the authoritative source in `src/data/rankings.json`), joined to Sleeper's pool so every
   entry carries real team/status. Players are given a 0–100 value that decreases with their
   expert rank; anyone outside the top-N falls to a low floor. If that file is empty, it falls
   back to the ESPN provider, then to a built-in tier baseline.
3. `/api/advice` merges that board with your roster, computes positional needs against a
   standard 1 QB / 2 RB / 2 WR / 1 TE / 1 FLEX lineup, and picks the best player. If an
   LLM key is set, it asks the model directly; otherwise the built-in engine answers.

> **Why not Sleeper/ESPN for rankings?** Sleeper's public API exposes the roster but **not**
> ADP/rankings (its projections endpoint returns empty), and ESPN's free endpoint doesn't return
> expert ADP without a league context — so the rankings come from the FantasyPros consensus you
> feed in. Team/status fields always come from Sleeper.

---

## Deploying to share with friends

The simplest host is [Vercel](https://vercel.com) (free):

```bash
# npm CLI
npx vercel
```

Or connect the repo to Vercel from the dashboard and it auto-deploys on push.

Once deployed, the URL on the deployment (e.g. `https://your-app.vercel.app`) is what you
send to friends. On phones, **Add to Home Screen** installs it as an app (PWA).

See the [offline-support guide](https://nextjs.org/docs/app/guides/offline-support) if you
want to extend caching.

---

## Project structure

```
src/
  app/
    page.tsx            # home (header + DraftApp)
    layout.tsx          # root layout, PWA metadata, SW registration
    manifest.ts         # PWA web manifest
    api/
      players/route.ts  # GET /api/players  -> ranked board (live Sleeper)
      advice/route.ts   # POST /api/advice  -> next-pick recommendation
  components/
    DraftApp.tsx        # main client orchestrator
    PlayerRow.tsx       # board row
    AdvicePanel.tsx     # recommendation card
    pwa/ServiceWorkerRegister.tsx
  lib/
    types.ts            # domain types + scoring/roster defaults
    sleeper.ts          # Sleeper client
    espn.ts             # ESPN rankings client (best-effort)
    rankings.ts         # value engine + board builder
    advice.ts           # heuristic + LLM advice engine
    ai/llm.ts           # optional LLM hook
  data/
    baseRankings.ts     # curated expert tier baseline
```

---

## Roadmap (from the original idea)

- [ ] Live mock-draft simulation (AI drafts against you)
- [ ] Auction / snake draft sync with a real league
- [ ] Player deep-dives, sleeper picks, and trade/steal analysis
- [ ] Connect a real projections/ADP feed (paid or Sleeper's league API) — the provider
      interface in `lib/rankings.ts` is the swap point
- [ ] Persist a shared draft room so friends see the same board

## Notes & limitations

- The player/team/status data comes straight from Sleeper's live public API; the app does
  not second-guess it.
- Without an LLM key, the advice is deterministic and transparent (it's a value model, not
  a generative model). Add `AI_API_KEY` for richer prose.
- This is an MVP thin slice; the board/value model is a defensible starting point and can be
  upgraded with a live ADP/projections source later.
