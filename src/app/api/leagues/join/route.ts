import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const Body = z.object({ code: z.string().min(4) });

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const league = await prisma.league.findUnique({ where: { inviteCode: parsed.data.code } });
  if (!league) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.membership.upsert({
    where: { userId_leagueId: { userId, leagueId: league.id } },
    update: {},
    create: { userId, leagueId: league.id },
  });
  return NextResponse.json({ league });
}
