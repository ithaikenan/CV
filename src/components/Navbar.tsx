import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;
  return (
    <header className="border-b border-ink-800/80 bg-ink-950/70 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <img src="/monkey.svg" alt="" className="h-7 w-7" />
          <span>Playoff <span className="text-banana-500">Monkey</span></span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link href="/leagues" className="btn btn-ghost">Leagues</Link>
              <Link href="/games" className="btn btn-ghost">Games</Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="btn btn-ghost" type="submit">
                  Sign out
                </button>
              </form>
              {user.image && (
                <img src={user.image} alt="" className="h-8 w-8 rounded-full border border-ink-700" />
              )}
            </>
          ) : (
            <>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/leagues" });
                }}
              >
                <button className="btn btn-ghost" type="submit">Google</button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("facebook", { redirectTo: "/leagues" });
                }}
              >
                <button className="btn btn-primary" type="submit">Sign in with Facebook</button>
              </form>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
