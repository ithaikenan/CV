import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const Body = z.object({
  gameId: z.string().min(1),
  homeScore: z.number().int().min(0).max(250),
  awayScore: z.number().int().min(0).max(250),
});

/**
 * Upsert the current user's guess for a game. Locks are enforced here:
 * we refuse any write once `now >= tipoffAt`. Guesses are global to the user
 * (shared across all their leagues) — requirement 9.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { gameId, homeScore, awayScore } = parsed.data;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (Date.now() >= game.tipoffAt.getTime()) {
    return NextResponse.json({ error: "locked" }, { status: 409 });
  }

  const saved = await prisma.guess.upsert({
    where: { userId_gameId: { userId, gameId } },
    update: { homeScore, awayScore },
    create: { userId, gameId, homeScore, awayScore },
  });
  return NextResponse.json({ ok: true, guess: saved });
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const gameId = url.searchParams.get("gameId");
  if (gameId) {
    const g = await prisma.guess.findUnique({
      where: { userId_gameId: { userId, gameId } },
    });
    return NextResponse.json({ guess: g });
  }
  const list = await prisma.guess.findMany({ where: { userId } });
  return NextResponse.json({ guesses: list });
}
