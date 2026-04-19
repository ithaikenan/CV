import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/standings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Must be a member to view standings.
  const member = await prisma.membership.findUnique({
    where: { userId_leagueId: { userId, leagueId } },
  });
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await computeStandings(leagueId);
  return NextResponse.json({ rows });
}
