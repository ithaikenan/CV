# Playoff Monkey 🐒🏀

An NBA-playoffs fan engagement app: pick scores for every game, join leagues
with your friends, and try to finish ahead of the Monkey.

- **Domain:** playoffmonkey.com
- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · NextAuth v5
  (Google + Facebook) · Prisma · Postgres (Vercel + Neon)
- **Theme:** dark blue + banana yellow accent.

## Feature checklist

1. Dark-blue "Playoff Monkey" theme at `tailwind.config.ts` / `globals.css`.
2. **Auth options** (NextAuth v5, JWT 90-day httpOnly cookie refreshed on each
   request, returning users stay signed in on the same device — `src/auth.ts`):
   - Google OAuth
   - Email + password (Credentials provider; bcrypt hashes — `/signup`, `/signin`)
3. **Tutorial** at `/about` explaining the "you're never out" angle, trial
   week, scoring, Monkey, leagues.
4. **League house rules** — admins (league owner) edit free-text rules at
   `/leagues/[id]/rules`. Rules lock at `RULES_LOCK_AT` (end of Saturday
   2026-04-25 ET). Public view for members is on the league detail page.
5. **Trial period** — `SEASON_START_AT = 2026-04-25T00:00:00Z`. Guesses on games
   tipping off before that don't award points (`src/lib/standings.ts` skips
   them). Trial banner on landing / games / league pages.
6. **Admin dashboard** at `/admin` guarded by `ADMIN_EMAILS` env var. Shows
   total players, leagues, guesses, games synced, live/final counts, recent
   signups + recent leagues.
7. Every user is auto-enrolled in the Global League on first sign-in (see
   `src/auth.ts` `events.createUser` and `src/app/leagues/page.tsx`). Users
   can create private leagues and share invite codes (`/leagues/new`,
   `/leagues/join`).
8. Picks lock at tipoff; other players' picks hidden until then
   (`src/app/api/guesses/route.ts`, `src/app/api/games/[id]/guesses/route.ts`).
9. Scoring (regulation time) — `src/lib/scoring.ts` / `src/lib/rounds.ts`:
   1/2/5 → 2/4/10 → 3/6/15 → 4/8/20 by round. Best single tier awarded.
10. Monkey (`src/lib/monkey.ts`): deterministic Box-Muller, `P(higher seed) =
    0.50 + 0.05·gap + 0.04·home`, winner ~ N(112,7), margin ~ |N(8,6)|.
    Generated at tipoff − 1 min; Monkey is a real `User` auto-joined to every
    league.
11. Guesses stored per `(user, game)` — shared across all leagues.

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
