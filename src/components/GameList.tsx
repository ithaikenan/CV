import { prisma } from "@/lib/db";
import { ROUND_NAME } from "@/lib/rounds";
import { GuessForm } from "./GuessForm";

interface Props {
  userId: string;
  leagueId?: string;
}

function fmt(d: Date) {
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export async function GameList({ userId }: Props) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 36);
  const games = await prisma.game.findMany({
    where: { tipoffAt: { gte: since } },
    orderBy: { tipoffAt: "asc" },
    take: 40,
  });
  const myGuesses = await prisma.guess.findMany({ where: { userId, gameId: { in: games.map((g) => g.id) } } });
  const gmap = new Map(myGuesses.map((g) => [g.gameId, g] as const));

  if (games.length === 0) {
    return (
      <div className="card text-white/60">
        No playoff games on file yet. Hit <code className="text-banana-500">/api/cron/sync</code> to pull the schedule.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {games.map((g) => {
        const locked = Date.now() >= g.tipoffAt.getTime();
        const mine = gmap.get(g.id);
        const live = g.status === "live";
        const fin = g.status === "final";
        return (
          <div key={g.id} className="card">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs text-white/50">{ROUND_NAME[g.round]} · {fmt(g.tipoffAt)}</div>
                <div className="font-display text-lg font-bold">
                  {g.awayTeam} <span className="text-white/50">@</span> {g.homeTeam}
                </div>
                {(live || fin) && (
                  <div className="text-sm text-white/80">
                    {g.awayTeam} {g.awayScore ?? 0} — {g.homeScore ?? 0} {g.homeTeam}
                    {live && <span className="badge bg-rim/20 text-rim ml-2">LIVE · Q{g.period ?? "?"} {g.clock ?? ""}</span>}
                    {fin && <span className="badge bg-banana-500/20 text-banana-500 ml-2">FINAL</span>}
                  </div>
                )}
              </div>
              <GuessForm
                gameId={g.id}
                homeTeam={g.homeTeam}
                awayTeam={g.awayTeam}
                locked={locked}
                initialHome={mine?.homeScore}
                initialAway={mine?.awayScore}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
