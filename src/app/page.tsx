import Link from "next/link";
import { auth, signIn } from "@/auth";

export default async function Home() {
  const session = await auth();
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
              friends. A monkey plays too — if you finish behind it, you&apos;ll hear about it.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {session?.user ? (
            <Link href="/leagues" className="btn btn-primary">Go to my leagues</Link>
          ) : (
            <>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/leagues" });
                }}
              >
                <button className="btn btn-primary" type="submit">Sign up with Google</button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("facebook", { redirectTo: "/leagues" });
                }}
              >
                <button className="btn btn-ghost" type="submit">Continue with Facebook</button>
              </form>
            </>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Feature
          title="Guess until tipoff"
          body="Change your picks up to game time. At tipoff everything locks."
        />
        <Feature
          title="Points by round"
          body="1/2/5 in the first round, scaling to 4/8/20 in the Finals."
        />
        <Feature
          title="The Monkey plays too"
          body="Every league includes the Monkey. Its picks are based on seed + home court + a dash of randomness."
        />
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
