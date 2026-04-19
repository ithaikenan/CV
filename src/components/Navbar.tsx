import Link from "next/link";
import { auth, signOut } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = isAdminEmail(user?.email);
  return (
    <header className="border-b border-ink-800/80 bg-ink-950/70 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <img src="/monkey.svg" alt="" className="h-7 w-7" />
          <span>Playoff <span className="text-banana-500">Monkey</span></span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <Link href="/about" className="btn btn-ghost hidden sm:inline-flex">How it works</Link>
          {user ? (
            <>
              <Link href="/leagues" className="btn btn-ghost">Leagues</Link>
              <Link href="/games" className="btn btn-ghost">Games</Link>
              {isAdmin && (
                <Link href="/admin" className="btn btn-ghost text-banana-500">Admin</Link>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="btn btn-ghost" type="submit">Sign out</button>
              </form>
              {user.image && (
                <img src={user.image} alt="" className="h-8 w-8 rounded-full border border-ink-700" />
              )}
            </>
          ) : (
            <>
              <Link href="/signin" className="btn btn-ghost">Sign in</Link>
              <Link href="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
