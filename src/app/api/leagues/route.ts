import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma, MONKEY_USER_ID } from "@/lib/db";

export const runtime = "nodejs";

const Body = z.object({ name: z.string().min(2).max(40) });

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { league: true },
    orderBy: { joinedAt: "asc" },
  });
  return NextResponse.json({ leagues: memberships.map((m) => m.league) });
}

/** Create a private league. Creator is owner + auto-member, Monkey is auto-member. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const league = await prisma.league.create({
    data: {
      name: parsed.data.name,
      isGlobal: false,
      ownerId: userId,
      memberships: {
        create: [{ userId }, { userId: MONKEY_USER_ID }],
      },
    },
  });
  return NextResponse.json({ league });
}
