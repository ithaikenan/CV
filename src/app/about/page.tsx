import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="grid gap-6 max-w-3xl mx-auto">
      <header className="card bg-gradient-to-br from-ink-800/80 to-ink-900/80 border-ink-700">
        <h1 className="font-display text-4xl font-black">How Playoff Monkey works</h1>
        <p className="mt-2 text-white/75">
          Forget brackets. Pick the <span className="text-banana-500 font-semibold">exact score</span>
          &nbsp;of every playoff game, climb your league, and try to finish ahead of the Monkey.
        </p>
      </header>

      <section className="card">
        <h2 className="font-display text-2xl font-bold text-banana-500">You&apos;re never out</h2>
        <p className="mt-2 text-white/80">
          Most playoff games have you locked out the moment your first-round pick busts. Playoff
          Monkey is different. Every single game is its own shot at points — a blown guess on
          Tuesday has no bearing on Wednesday. If you&apos;re buried in the standings, a couple of
          exact-score calls in the Conference Finals can drag you all the way back to the top.
          Stay in it; the points scale up as the rounds do.
        </p>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-bold text-banana-500">The first week is a warm-up</h2>
        <p className="mt-2 text-white/80">
          The opening days of the playoffs don&apos;t count — they&apos;re a <em>trial run</em> so
          you can feel the app out, tune your gut on a couple of series, and get your private
          league set up with friends. Points officially start accumulating from the{" "}
          <span className="text-white font-semibold">first game of Saturday</span>. Anything before
          that is free practice.
        </p>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-bold text-banana-500">Making picks</h2>
        <ul className="mt-3 space-y-2 text-white/80 list-disc list-inside">
          <li>Guess the final score for both teams, for every game.</li>
          <li>Change your mind as much as you like — picks lock the instant the ball tips.</li>
          <li>You can&apos;t see anyone else&apos;s picks until after tipoff. No copying.</li>
          <li>Your picks are the same across every league you&apos;re in — submit once, count everywhere.</li>
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-bold text-banana-500">Scoring</h2>
        <p className="mt-2 text-white/80">
          Points are awarded on the <span className="font-semibold">regulation-time</span>{" "}
          score (we ignore overtime). For each game you get the <em>best</em> tier you qualify for:
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/80 text-white/70">
              <tr>
                <th className="text-left px-3 py-2">Round</th>
                <th className="text-right px-3 py-2">Correct winner</th>
                <th className="text-right px-3 py-2">Exact point difference</th>
                <th className="text-right px-3 py-2">Exact final score</th>
              </tr>
            </thead>
            <tbody className="bg-ink-900/60">
              {[
                ["First Round", 1, 2, 5],
                ["Conference Semifinals", 2, 4, 10],
                ["Conference Finals", 3, 6, 15],
                ["NBA Finals", 4, 8, 20],
              ].map(([r, a, b, c]) => (
                <tr key={String(r)} className="border-t border-ink-800/80">
                  <td className="px-3 py-2">{r}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{a}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{b}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-banana-500 font-bold">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-white/60 text-sm">
          An exact final score is worth more than the point difference, which is worth more than just
          calling the winner. We award the best single tier you hit — not all three stacked.
        </p>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-bold text-banana-500">Leagues</h2>
        <ul className="mt-3 space-y-2 text-white/80 list-disc list-inside">
          <li>Everyone is automatically in the <span className="font-semibold">Global League</span>.</li>
          <li>Spin up a <span className="font-semibold">private league</span> for your friend group and share the invite code.</li>
          <li>You can be in as many private leagues as you like. Your picks follow you across all of them.</li>
          <li>League admins can set <span className="font-semibold">house rules</span> — free dinner for the winner, karaoke for last place, you name it. Rules lock at the end of Saturday.</li>
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-bold text-banana-500">The Monkey 🐒</h2>
        <p className="mt-2 text-white/80">
          Every league includes the Monkey as a player. It picks scores based on seeding, home-court,
          and a shake of randomness. It&apos;s not trying to win — it&apos;s trying to humble you.
          Finishing below a monkey in the standings is a valid reason to owe your friends a beer.
        </p>
      </section>

      <div className="flex gap-3 justify-center">
        <Link href="/signup" className="btn btn-primary">Create an account</Link>
        <Link href="/signin" className="btn btn-ghost">I already have one</Link>
      </div>
    </div>
  );
}
