import Link from "next/link";
import { auth } from "@/auth";
import { SEASON_START_AT } from "@/lib/constants";

export default async function Home() {
  const session = await auth();
  const trial = Date.now() < SEASON_START_AT.getTime();
  return (
    <div className="grid gap-10">
      <section className="card bg-gradient-to-br from-ink-800/80 to-ink-900/80 border-ink-700">
        <div className="flex items-center gap-4">
          <img src="/monkey.svg" alt="" className="h-16 w-16 drop-shadow-[0_0_30px_rgba(245,197,24,.35)]" />
          <div>
            <h1 className="font-display text-4xl font-black">
              Pick every game. <span className="text-banana-500">Beat the Monkey.</span>
            </h1>
            <p className="text-white/70 mt-2 max-w-2xl">
              Guess NBA playoff scores, climb the Global League, and start private leagues with your
              friends. One blown pick doesn&apos;t knock you out — exact calls in later rounds can pull
              you back into contention.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {session?.user ? (
            <Link href="/leagues" className="btn btn-primary">Go to my leagues</Link>
          ) : (
            <>
              <Link href="/signup" className="btn btn-primary">Create free account</Link>
              <Link href="/signin" className="btn btn-ghost">Sign in</Link>
            </>
          )}
          <Link href="/about" className="btn btn-ghost">How it works</Link>
        </div>
        {trial && (
          <div className="mt-5 rounded-xl border border-banana-500/40 bg-banana-500/10 px-4 py-3 text-sm text-banana-500">
            <span className="font-bold">Trial period</span> — the first days of the playoffs are a warm-up.
            Points officially start from the first game of Saturday.
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Feature title="Always in the game" body="Every game is its own shot at points. A blown first-round pick can't knock you out — nail an exact Finals score and jump the pack." />
        <Feature title="Points scale by round" body="1/2/5 in Round 1 climbing to 4/8/20 in the Finals (winner / exact diff / exact score)." />
        <Feature title="The Monkey plays too" body="Every league includes a Monkey whose picks are a weighted seed+home-court coin flip. Don't finish behind it." />
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="font-display text-lg font-bold text-banana-500">{title}</h3>
      <p className="text-white/70 mt-2 text-sm">{body}</p>
    </div>
  );
}
