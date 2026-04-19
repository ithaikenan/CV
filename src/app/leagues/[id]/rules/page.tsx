import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { areRulesLocked, RULES_LOCK_AT } from "@/lib/constants";
import { DEFAULT_LEAGUE_RULES } from "@/lib/defaults";

export const dynamic = "force-dynamic";

export default async function RulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) notFound();

  // Private leagues: only members can view the rules. Global: everyone's a member.
  const member = await prisma.membership.findUnique({
    where: { userId_leagueId: { userId, leagueId: id } },
  });
  if (!member) {
    return (
      <div className="card max-w-md mx-auto mt-10">
        <h1 className="font-display text-xl font-bold">Not a member</h1>
        <p className="text-white/60 mt-1 text-sm">
          This is a private league. Ask the owner for the invite code.
        </p>
      </div>
    );
  }

  const isOwner = league.ownerId === userId && !league.isGlobal;
  const locked = areRulesLocked();

  async function save(formData: FormData) {
    "use server";
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return;
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league || league.isGlobal) return;
    if (league.ownerId !== userId) return;
    if (areRulesLocked()) return;

    const rules = String(formData.get("rules") ?? "").slice(0, 5000);
    await prisma.league.update({
      where: { id },
      data: { rules, rulesUpdatedAt: new Date() },
    });
    redirect(`/leagues/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6">
      <div>
        <Link href={`/leagues/${id}`} className="text-sm text-white/60 hover:text-white">
          ← back to league
        </Link>
        <h1 className="font-display text-3xl font-bold mt-2">House rules — {league.name}</h1>
        <p className="text-white/60 text-sm mt-1">
          Have fun with this. Winner gets a free dinner, losers do karaoke, whatever makes your
          group laugh. Rules lock{" "}
          <span className="text-banana-500">{RULES_LOCK_AT.toLocaleString(undefined, { dateStyle: "full" })}</span>.
        </p>
      </div>

      {league.isGlobal && (
        <div className="card">
          The Global League has no custom rules — those are for private leagues you run yourself.
        </div>
      )}

      {!league.isGlobal && !isOwner && (
        <div className="card">
          <h2 className="font-display text-xl font-bold">Rules</h2>
          <pre className="mt-3 whitespace-pre-wrap font-body text-white/80 leading-relaxed">
            {league.rules ?? "The admin hasn't set custom rules yet."}
          </pre>
          <p className="text-xs text-white/50 mt-3">Only the league admin can edit these.</p>
        </div>
      )}

      {isOwner && (
        <form action={save} className="card grid gap-3">
          {locked && (
            <div className="rounded-lg border border-rim/40 bg-rim/10 px-3 py-2 text-sm text-rim">
              The rules deadline has passed. Your last-saved rules are below (read-only).
            </div>
          )}
          <label className="grid gap-1 text-sm">
            <span className="text-white/70 font-semibold">House rules</span>
            <textarea
              name="rules"
              className="input min-h-[240px] font-body"
              maxLength={5000}
              defaultValue={league.rules ?? DEFAULT_LEAGUE_RULES}
              disabled={locked}
            />
          </label>
          {!locked && (
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">Save rules</button>
              <Link href={`/leagues/${id}`} className="btn btn-ghost">Cancel</Link>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
