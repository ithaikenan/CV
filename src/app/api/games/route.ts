import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upcoming + in-progress + recent playoff games, with the caller's own guess attached. */
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
  const games = await prisma.game.findMany({
    where: { tipoffAt: { gte: since } },
    orderBy: { tipoffAt: "asc" },
    take: 60,
  });

  let myGuesses: Record<string, { homeScore: number; awayScore: number } | null> = {};
  if (userId) {
    const gs = await prisma.guess.findMany({ where: { userId } });
    myGuesses = Object.fromEntries(gs.map((g) => [g.gameId, { homeScore: g.homeScore, awayScore: g.awayScore }]));
  }
  return NextResponse.json({ games, myGuesses });
}
