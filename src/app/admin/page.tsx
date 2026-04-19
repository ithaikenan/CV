import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma, MONKEY_USER_ID } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!session?.user) redirect("/signin");
  if (!isAdminEmail(email)) {
    return (
      <div className="card max-w-md mx-auto mt-10">
        <h1 className="font-display text-2xl font-bold">Not authorized</h1>
        <p className="text-white/60 mt-2 text-sm">
          Admin access requires your email in the <code>ADMIN_EMAILS</code> env var.
        </p>
      </div>
    );
  }

  const [
    totalUsersRaw,
    totalLeagues,
    privateLeagues,
    totalGuesses,
    totalGames,
    liveGames,
    finalGames,
    recentUsers,
    topLeagues,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.league.count(),
    prisma.league.count({ where: { isGlobal: false } }),
    prisma.guess.count(),
    prisma.game.count(),
    prisma.game.count({ where: { status: "live" } }),
    prisma.game.count({ where: { status: "final" } }),
    prisma.user.findMany({
      where: { isMonkey: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true, image: true },
    }),
    prisma.league.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { memberships: true } }, owner: { select: { name: true, email: true } } },
    }),
  ]);
  const totalUsers = totalUsersRaw - 1; // exclude The Monkey
  const monkey = await prisma.user.findUnique({ where: { id: MONKEY_USER_ID } });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <div className="text-xs text-white/50">signed in as {email}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Players" value={totalUsers} />
        <Stat label="Leagues (total)" value={totalLeagues} />
        <Stat label="Private leagues" value={privateLeagues} />
        <Stat label="Guesses submitted" value={totalGuesses} />
        <Stat label="Games synced" value={totalGames} />
        <Stat label="Live now" value={liveGames} accent />
        <Stat label="Final" value={finalGames} />
        <Stat label="Monkey present" value={monkey ? "yes" : "no"} />
      </div>

      <section className="card">
        <h2 className="font-display text-xl font-bold">Recent signups</h2>
        <ul className="mt-3 divide-y divide-ink-800/80">
          {recentUsers.length === 0 && <li className="text-white/60 py-2 text-sm">No users yet.</li>}
          {recentUsers.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-2 text-sm">
              {u.image ? (
                <img src={u.image} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-ink-700 flex items-center justify-center text-xs">
                  {u.name?.[0] ?? "?"}
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{u.name ?? "—"}</div>
                <div className="text-white/50 text-xs">{u.email ?? "no email"}</div>
              </div>
              <div className="text-white/50 text-xs">{u.createdAt.toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-xl font-bold">Recent leagues</h2>
        <ul className="mt-3 divide-y divide-ink-800/80">
          {topLeagues.map((l) => (
            <li key={l.id} className="flex items-center gap-3 py-2 text-sm">
              <div className="flex-1">
                <Link href={`/leagues/${l.id}`} className="font-medium hover:text-banana-500">
                  {l.name}
                </Link>
                <div className="text-white/50 text-xs">
                  {l.isGlobal ? "Global" : `owner: ${l.owner?.name ?? l.owner?.email ?? "—"}`}
                </div>
              </div>
              <div className="text-white/70 tabular-nums">{l._count.memberships} members</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`card ${accent ? "border-rim/50" : ""}`}>
      <div className="text-xs text-white/60 uppercase tracking-wide">{label}</div>
      <div className={`font-display text-3xl font-black mt-1 ${accent ? "text-rim" : "text-banana-500"}`}>
        {value}
      </div>
    </div>
  );
}
