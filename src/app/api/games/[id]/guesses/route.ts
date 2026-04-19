import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns all guesses for a game — but only after tipoff. Requirement 5/10:
 * you cannot view other players' guesses until the game starts.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const leagueId = url.searchParams.get("leagueId");

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (Date.now() < game.tipoffAt.getTime()) {
    return NextResponse.json({ locked: true, guesses: [] });
  }

  // Restrict to the league's members if a leagueId is passed; else all.
  const where: Record<string, unknown> = { gameId: id };
  if (leagueId) {
    const members = await prisma.membership.findMany({
      where: { leagueId },
      select: { userId: true },
    });
    where.userId = { in: members.map((m) => m.userId) };
  }

  const guesses = await prisma.guess.findMany({
    where,
    include: { user: { select: { id: true, name: true, image: true, isMonkey: true } } },
  });
  return NextResponse.json({ locked: false, guesses });
}
