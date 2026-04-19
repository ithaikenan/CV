# Playoff Monkey 🐒🏀

An NBA-playoffs fan engagement app: pick scores for every game, join leagues
with your friends, and try to finish ahead of the Monkey.

- **Domain:** playoffmonkey.com
- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · NextAuth v5
  (Google + Facebook) · Prisma · SQLite (dev) / Postgres (prod)
- **Theme:** dark blue + banana yellow accent.

## Feature checklist

1. Dark-blue "Playoff Monkey" theme at `tailwind.config.ts` / `globals.css`.
2. Google + Facebook OAuth via NextAuth v5; session cookie is httpOnly +
   90-day `maxAge`, refreshed on each request, so returning users don't re-auth
   on the same device (`src/auth.ts`).
3. Every user is auto-enrolled in the Global League on first sign-in (see
   `src/auth.ts` `events.createUser` and `src/app/leagues/page.tsx`). Users
   can create private leagues and share invite codes (`/leagues/new`,
   `/leagues/join`).
4. Picks can be edited until tipoff. The `POST /api/guesses` handler refuses
   writes once `now >= game.tipoffAt` (`src/app/api/guesses/route.ts`).
5. Other players' guesses are hidden until tipoff
   (`src/app/api/games/[id]/guesses/route.ts` and game detail page).
6. Scoring (regulation time) — `src/lib/scoring.ts` / `src/lib/rounds.ts`:
   - 1st round: 1 / 2 / 5
   - 2nd round: 2 / 4 / 10
   - Conference Finals: 3 / 6 / 15
   - NBA Finals: 4 / 8 / 20
   Award is the highest tier reached (winner OR exact-diff OR exact-score).
7. Monkey logic — `src/lib/monkey.ts`:
   - `P(higher-seed wins) = 0.50 + 0.05 * seedGap + 0.04 * home-court`,
     clamped to `[0.50, 0.85]`.
   - Winner points ~ `N(112, 7)` clamped `[95, 135]`.
   - Margin ~ `|N(8, 6)|` clamped `[1, 25]` → loser = winner − margin.
   - Deterministic per-game (`rngSeed = gameId`) so the guess is stable.
   - Generated at tipoff − 1 minute by `generateMonkeyGuesses()` in the cron
     tick so the Monkey behaves like a regular player.
8. The Monkey is a real `User` row (`id = "monkey"`, `isMonkey = true`) that
   is auto-joined to every league — so it appears in standings exactly like a
   human player.
9. Guesses are stored per `(user, game)` and shared across **all** leagues the
   user is in. Standings filter by league membership.
10. Reinforced in UI + API: `api/games/[id]/guesses` returns `locked: true`
    before tipoff; the game detail page hides the list until locked.

## Live updates

- `/api/cron/sync` runs a full tick (schedule refresh → monkey picks → lock →
  live-score refresh). `vercel.json` schedules it every minute.
- Standings page polls `/api/standings/:id` every 15s on the client
  (`src/components/Standings.tsx`) and shows **final** points plus **live**
  projected points — what each pick would score if the game ended right now
  using current regulation-time totals.

## NBA feed

Abstracted behind `GameProvider` (`src/lib/provider/index.ts`).

- **ESPN** (default, free): `site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`.
  No key. Returns quarter-by-quarter linescores so we back out regulation-only
  totals (OT points excluded from scoring).
- **balldontlie.io** (stub): `NBA_PROVIDER=balldontlie` + `BDL_API_KEY`. The
  paid "ALL-STAR" tier (~$10/mo) exposes `/box_scores/live` that refreshes
  every few seconds — worth the upgrade once you go live.

## Local development

```bash
cp .env.example .env
# fill in AUTH_SECRET (openssl rand -base64 32)
# add Google + Facebook OAuth creds for the providers you want
npm install
npx prisma db push
npm run db:seed             # optional: adds 3 sample games + Monkey + Global League
npm run dev                 # http://localhost:3000
# in another shell, pull the real schedule + live scores:
npm run sync:schedule
```

### OAuth setup

- **Google**: https://console.cloud.google.com/apis/credentials. Redirect URI:
  `http://localhost:3000/api/auth/callback/google` (+ your prod domain).
- **Facebook**: https://developers.facebook.com/. Add **Facebook Login**
  product. Redirect URI: `http://localhost:3000/api/auth/callback/facebook`.

## Deploying to Vercel

1. Point playoffmonkey.com DNS at Vercel.
2. Switch `prisma/schema.prisma` `datasource.provider` from `sqlite` →
   `postgresql`. Use Neon / Supabase / RDS for `DATABASE_URL`.
3. Set env vars: `AUTH_SECRET`, `AUTH_URL=https://playoffmonkey.com`,
   `AUTH_TRUST_HOST=true`, Google/Facebook creds, `CRON_SECRET`,
   `NBA_PROVIDER` (and `BDL_API_KEY` if paid).
4. `vercel.json` runs `/api/cron/sync` every minute. Add the `x-cron-secret`
   header via a Vercel cron secret or swap to a pull-based cron.

## Project layout

```
src/
  auth.ts                 # NextAuth v5 config (Google + Facebook, 90d cookie)
  app/
    page.tsx              # Landing
    signin/               # Sign-in page
    leagues/              # /leagues, /leagues/new, /leagues/join, /leagues/[id]
    games/                # /games, /games/[id]
    api/
      auth/[...nextauth]/ # NextAuth handlers
      guesses/            # POST/GET guesses (lock-enforced)
      games/              # Per-game picks (post-tipoff only)
      leagues/            # Create league + join by code
      standings/[id]/     # Live standings
      cron/sync/          # Cron entry: schedule + monkey + lock + live
  components/
    Navbar.tsx
    GameList.tsx
    GuessForm.tsx
    Standings.tsx (client; polls every 15s)
  lib/
    db.ts rounds.ts scoring.ts monkey.ts standings.ts sync.ts
    provider/{index,espn,balldontlie}.ts
prisma/schema.prisma
scripts/{sync-schedule,sync-scores}.ts
vercel.json               # Cron every 1 minute
```

## Open items / nice-to-haves

- Series bracket view with projected series winners.
- Tie-breakers in standings (most exact scores, then most exact diffs).
- Push notifications at tipoff − 10 min for unsubmitted picks.
- OT scoreboard UI (we already exclude OT from scoring; worth surfacing).
- Replace polling with SSE / websocket once you outgrow `setInterval`.
