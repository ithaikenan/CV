import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Standings } from "@/components/Standings";
import { GameList } from "@/components/GameList";

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

  return (
    <div className="grid md:grid-cols-[1fr_360px] gap-6">
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{league.name}</h1>
            <div className="text-white/60 text-sm">
              {league.isGlobal ? "Global" : `Invite code: ${league.inviteCode}`} · {league._count.memberships} members
            </div>
          </div>
        </div>
        <GameList userId={userId} leagueId={id} />
      </div>
      <div className="grid gap-4">
        <Standings leagueId={id} />
      </div>
    </div>
  );
}
