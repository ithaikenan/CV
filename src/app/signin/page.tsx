import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/leagues");
  const { error } = await searchParams;

  async function credentialsSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    try {
      await signIn("credentials", { email, password, redirectTo: "/leagues" });
    } catch (e) {
      // NextAuth throws a redirect; a real failure ends up here.
      if ((e as Error)?.message?.includes("NEXT_REDIRECT")) throw e;
      redirect("/signin?error=bad_credentials");
    }
  }

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      <p className="text-white/60 mt-1 text-sm">We&apos;ll keep you logged in on this device.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-rim/40 bg-rim/10 px-3 py-2 text-sm text-rim">
          Incorrect email or password.
        </div>
      )}

      <form action={credentialsSignIn} className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Email</span>
          <input name="email" type="email" className="input" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Password</span>
          <input name="password" type="password" className="input" required minLength={8} />
        </label>
        <button className="btn btn-primary" type="submit">Sign in</button>
      </form>

      <div className="mt-4 text-center text-xs text-white/50">or</div>

      <form
        className="mt-4"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/leagues" });
        }}
      >
        <button className="btn btn-ghost w-full" type="submit">Continue with Google</button>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        New here? <Link href="/signup" className="text-banana-500 underline">Create an account</Link>
      </p>
    </div>
  );
}
