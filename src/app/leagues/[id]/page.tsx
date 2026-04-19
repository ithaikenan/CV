import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Standings } from "@/components/Standings";
import { GameList } from "@/components/GameList";
import { SEASON_START_AT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LeagueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");

  const league = await prisma.league.findUnique({
    where: { id },
    include: { _count: { select: { memberships: true } } },
  });
  if (!league) notFound();

  const member = await prisma.membership.findUnique({
    where: { userId_leagueId: { userId, leagueId: id } },
  });
  if (!member) {
    return (
      <div className="card max-w-md">
        <h1 className="font-display text-xl font-bold">Not a member</h1>
        <p className="text-white/60 mt-1 text-sm">Ask the owner for the invite code.</p>
      </div>
    );
  }

  const isOwner = league.ownerId === userId && !league.isGlobal;
  const trialActive = Date.now() < SEASON_START_AT.getTime();

  return (
    <div className="grid md:grid-cols-[1fr_360px] gap-6">
      <div className="grid gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display text-3xl font-bold">{league.name}</h1>
            <div className="text-white/60 text-sm">
              {league.isGlobal ? "Global" : `Invite code: ${league.inviteCode}`} · {league._count.memberships} members
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/leagues/${id}/rules`} className="btn btn-ghost">
              {isOwner ? "Edit house rules" : "View rules"}
            </Link>
          </div>
        </div>

        {trialActive && (
          <div className="card bg-banana-500/10 border-banana-500/40">
            <div className="font-display font-bold text-banana-500">Trial period</div>
            <div className="text-white/80 text-sm mt-1">
              Points officially start from the first game on Saturday. Pick freely until then — it&apos;s practice.
            </div>
          </div>
        )}

        {league.rules && !league.isGlobal && (
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">House rules</h2>
              {isOwner && (
                <Link href={`/leagues/${id}/rules`} className="text-sm text-banana-500 underline">
                  Edit
                </Link>
              )}
            </div>
            <pre className="mt-3 whitespace-pre-wrap font-body text-white/80 leading-relaxed text-sm">
              {league.rules}
            </pre>
          </div>
        )}

        <GameList userId={userId} leagueId={id} />
      </div>
      <div className="grid gap-4">
        <Standings leagueId={id} />
      </div>
    </div>
  );
}
