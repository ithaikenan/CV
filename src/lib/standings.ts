import { prisma } from "./db";
import { scoreGuess } from "./scoring";

export interface StandingRow {
  userId: string;
  name: string;
  image: string | null;
  isMonkey: boolean;
  finalPoints: number;   // settled (finalized games only)
  livePoints: number;    // projected if games ended now (live regulation score)
  totalPoints: number;   // finalPoints + livePoints
}

/**
 * Live standings for a league. Final points come from games with status=final
 * and regulation scores set. "Live" points project what each guess would earn
 * if the in-progress game ended now, using current regulation totals. Players
 * cannot see other players' guesses until tipoff (enforced in API routes); the
 * scoreboard here only reveals aggregate points.
 */
export async function computeStandings(leagueId: string): Promise<StandingRow[]> {
  const members = await prisma.membership.findMany({
    where: { leagueId },
    include: { user: true },
  });
  if (members.length === 0) return [];

  const userIds = members.map((m) => m.userId);

  // Fetch all guesses for these users for games that are live or final.
  const guesses = await prisma.guess.findMany({
    where: {
      userId: { in: userIds },
      game: { status: { in: ["live", "final"] } },
    },
    include: { game: true },
  });

  const byUser = new Map<string, { final: number; live: number }>();
  for (const u of userIds) byUser.set(u, { final: 0, live: 0 });

  for (const g of guesses) {
    const game = g.game;
    if (game.status === "final") {
      const ah = game.homeRegScore ?? game.homeScore ?? 0;
      const aa = game.awayRegScore ?? game.awayScore ?? 0;
      const pts = scoreGuess({
        round: game.round,
        actualHome: ah,
        actualAway: aa,
        guessHome: g.homeScore,
        guessAway: g.awayScore,
      });
      byUser.get(g.userId)!.final += pts;
    } else if (game.status === "live") {
      // Project using current regulation totals; if still in reg the scores
      // reflect the current state. OT points are excluded from scoring.
      const ah = game.homeRegScore ?? game.homeScore ?? 0;
      const aa = game.awayRegScore ?? game.awayScore ?? 0;
      const pts = scoreGuess({
        round: game.round,
        actualHome: ah,
        actualAway: aa,
        guessHome: g.homeScore,
        guessAway: g.awayScore,
      });
      byUser.get(g.userId)!.live += pts;
    }
  }

  const rows: StandingRow[] = members.map((m) => {
    const b = byUser.get(m.userId)!;
    return {
      userId: m.userId,
      name: m.user.name ?? (m.user.isMonkey ? "The Monkey" : "Player"),
      image: m.user.image,
      isMonkey: m.user.isMonkey,
      finalPoints: b.final,
      livePoints: b.live,
      totalPoints: b.final + b.live,
    };
  });

  rows.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
  return rows;
}
