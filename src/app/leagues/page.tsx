import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma, GLOBAL_LEAGUE_ID } from "@/lib/db";
import { ensureCoreRows } from "@/lib/sync";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");

  await ensureCoreRows();
  // Make sure every signed-in user is in the global league (requirement 3).
  await prisma.membership.upsert({
    where: { userId_leagueId: { userId, leagueId: GLOBAL_LEAGUE_ID } },
    update: {},
    create: { userId, leagueId: GLOBAL_LEAGUE_ID },
  });

  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { league: { include: { _count: { select: { memberships: true } } } } },
    orderBy: [{ league: { isGlobal: "desc" } }, { joinedAt: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Your leagues</h1>
        <div className="flex gap-2">
          <Link href="/leagues/new" className="btn btn-primary">New private league</Link>
          <Link href="/leagues/join" className="btn btn-ghost">Join by code</Link>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {memberships.map((m) => (
          <Link key={m.leagueId} href={`/leagues/${m.leagueId}`} className="card hover:border-banana-500/60 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-xl font-bold">{m.league.name}</div>
                <div className="text-white/60 text-sm">
                  {m.league.isGlobal ? "Everyone plays here" : "Private"} · {m.league._count.memberships} members
                </div>
              </div>
              {m.league.isGlobal ? (
                <span className="badge bg-banana-500/20 text-banana-500">Global</span>
              ) : (
                <span className="badge bg-ink-700 text-white/80">Code: {m.league.inviteCode.slice(0, 6)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
