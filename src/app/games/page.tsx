import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GameList } from "@/components/GameList";

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
      <GameList userId={userId} />
    </div>
  );
}
