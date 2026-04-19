import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GameList } from "@/components/GameList";
import { SEASON_START_AT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl font-bold">Playoff games</h1>
      <p className="text-white/60 text-sm">
        Your picks are shared across every league you&apos;re in. Change them any time before tipoff.
      </p>
      {Date.now() < SEASON_START_AT.getTime() && (
        <div className="card bg-banana-500/10 border-banana-500/40 text-sm text-white/80">
          <span className="font-bold text-banana-500">Trial period:</span> picks before Saturday&apos;s first game are practice — no points awarded.
        </div>
      )}
      <GameList userId={userId} />
    </div>
  );
}
