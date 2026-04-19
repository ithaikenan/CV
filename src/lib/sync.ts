import { prisma, GLOBAL_LEAGUE_ID, MONKEY_USER_ID } from "./db";
import { getProvider, type ProviderGame } from "./provider";
import { monkeyGuess } from "./monkey";

/** Upsert the global league and the Monkey user (+ Monkey membership in global). */
export async function ensureCoreRows() {
  await prisma.user.upsert({
    where: { id: MONKEY_USER_ID },
    update: {},
    create: {
      id: MONKEY_USER_ID,
      name: "The Monkey",
      image: "/monkey.svg",
      isMonkey: true,
    },
  });

  await prisma.league.upsert({
    where: { id: GLOBAL_LEAGUE_ID },
    update: {},
    create: { id: GLOBAL_LEAGUE_ID, name: "Global League", isGlobal: true },
  });

  await prisma.membership.upsert({
    where: { userId_leagueId: { userId: MONKEY_USER_ID, leagueId: GLOBAL_LEAGUE_ID } },
    update: {},
    create: { userId: MONKEY_USER_ID, leagueId: GLOBAL_LEAGUE_ID },
  });
}

export async function syncSchedule() {
  await ensureCoreRows();
  const provider = getProvider();
  const games = await provider.fetchSchedule();
  for (const g of games) {
    await upsertGame(g);
  }
  return games.length;
}

export async function syncLiveScores() {
  await ensureCoreRows();
  const provider = getProvider();
  const now = new Date();
  const soon = new Date(now.getTime() + 15 * 60 * 1000);
  const active = await prisma.game.findMany({
    where: {
      OR: [
        { status: "live" },
        { status: "scheduled", tipoffAt: { lte: soon } },
      ],
    },
    select: { id: true },
    take: 40,
  });
  if (active.length === 0) return 0;
  const live = await provider.fetchLive(active.map((g) => g.id));
  for (const g of live) await upsertGame(g);
  return live.length;
}

async function upsertGame(g: ProviderGame) {
  await prisma.game.upsert({
    where: { id: g.id },
    update: {
      round: g.round,
      seriesId: g.seriesId,
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      homeSeed: g.homeSeed ?? null,
      awaySeed: g.awaySeed ?? null,
      tipoffAt: g.tipoffAt,
      status: g.status,
      homeScore: g.homeScore ?? null,
      awayScore: g.awayScore ?? null,
      homeRegScore: g.homeRegScore ?? null,
      awayRegScore: g.awayRegScore ?? null,
      period: g.period ?? null,
      clock: g.clock ?? null,
    },
    create: {
      id: g.id,
      round: g.round,
      seriesId: g.seriesId,
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      homeSeed: g.homeSeed ?? null,
      awaySeed: g.awaySeed ?? null,
      tipoffAt: g.tipoffAt,
      status: g.status,
      homeScore: g.homeScore ?? null,
      awayScore: g.awayScore ?? null,
      homeRegScore: g.homeRegScore ?? null,
      awayRegScore: g.awayRegScore ?? null,
      period: g.period ?? null,
      clock: g.clock ?? null,
    },
  });
}

/**
 * Generate Monkey guesses for any game whose tipoff is within the next minute
 * (or already started) and that doesn't yet have a Monkey guess. This is the
 * "lock-time" auto-pick so the Monkey behaves like a regular player.
 */
export async function generateMonkeyGuesses() {
  await ensureCoreRows();
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 1000);
  const games = await prisma.game.findMany({
    where: { tipoffAt: { lte: soon } },
    select: { id: true, homeTeam: true, awayTeam: true, homeSeed: true, awaySeed: true },
  });
  let created = 0;
  for (const g of games) {
    const existing = await prisma.guess.findUnique({
      where: { userId_gameId: { userId: MONKEY_USER_ID, gameId: g.id } },
    });
    if (existing) continue;
    const mg = monkeyGuess({
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      homeSeed: g.homeSeed,
      awaySeed: g.awaySeed,
      rngSeed: g.id,
    });
    await prisma.guess.create({
      data: {
        userId: MONKEY_USER_ID,
        gameId: g.id,
        homeScore: mg.homeScore,
        awayScore: mg.awayScore,
        lockedAt: new Date(),
      },
    });
    created++;
  }
  return created;
}

/** Lock all guesses for a game at tipoff. Idempotent. */
export async function lockGuessesAtTipoff() {
  const now = new Date();
  const games = await prisma.game.findMany({
    where: { tipoffAt: { lte: now } },
    select: { id: true },
  });
  if (games.length === 0) return 0;
  const res = await prisma.guess.updateMany({
    where: { gameId: { in: games.map((g) => g.id) }, lockedAt: null },
    data: { lockedAt: now },
  });
  return res.count;
}

export async function runFullSyncTick() {
  // Order matters: schedule -> monkey picks for imminent games -> lock -> live.
  await syncSchedule();
  await generateMonkeyGuesses();
  await lockGuessesAtTipoff();
  await syncLiveScores();
}
