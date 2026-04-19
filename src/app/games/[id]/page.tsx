import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ROUND_NAME } from "@/lib/rounds";
import { GuessForm } from "@/components/GuessForm";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function GameDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) notFound();

  const mine = await prisma.guess.findUnique({ where: { userId_gameId: { userId, gameId: id } } });
  const locked = Date.now() >= game.tipoffAt.getTime();

  const guesses = locked
    ? await prisma.guess.findMany({
        where: { gameId: id },
        include: { user: { select: { id: true, name: true, image: true, isMonkey: true } } },
        orderBy: [{ user: { isMonkey: "desc" } }, { createdAt: "asc" }],
      })
    : [];

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-xs text-white/50">{ROUND_NAME[game.round]} · {fmt(game.tipoffAt)}</div>
        <h1 className="font-display text-3xl font-bold">
          {game.awayTeam} <span className="text-white/50">@</span> {game.homeTeam}
        </h1>
        {game.status !== "scheduled" && (
          <div className="text-lg mt-1">
            {game.awayTeam} {game.awayScore ?? 0} — {game.homeScore ?? 0} {game.homeTeam}
            {game.status === "live" && <span className="badge bg-rim/20 text-rim ml-2">LIVE</span>}
            {game.status === "final" && <span className="badge bg-banana-500/20 text-banana-500 ml-2">FINAL</span>}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-display text-xl font-bold">Your pick</h2>
        <div className="mt-3">
          <GuessForm
            gameId={game.id}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            locked={locked}
            initialHome={mine?.homeScore}
            initialAway={mine?.awayScore}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-xl font-bold">All picks</h2>
        {!locked ? (
          <p className="text-white/60 text-sm mt-2">
            Hidden until tipoff — no peeking at your friends&apos; guesses.
          </p>
        ) : guesses.length === 0 ? (
          <p className="text-white/60 text-sm mt-2">No picks were submitted.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-800/80">
            {guesses.map((g) => (
              <li key={g.id} className="py-2 flex items-center gap-3">
                {g.user.image ? (
                  <img src={g.user.image} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-ink-700 flex items-center justify-center text-xs">
                    {g.user.isMonkey ? "🐒" : (g.user.name?.[0] ?? "?")}
                  </div>
                )}
                <span className="font-medium">{g.user.name ?? "Player"}</span>
                {g.user.isMonkey && <span className="badge bg-banana-500/20 text-banana-500">MONKEY</span>}
                <span className="ml-auto tabular-nums">
                  {game.awayTeam} <b>{g.awayScore}</b> — <b>{g.homeScore}</b> {game.homeTeam}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
