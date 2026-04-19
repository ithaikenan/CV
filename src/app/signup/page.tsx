import { redirect } from "next/navigation";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { auth, signIn } from "@/auth";
import { prisma, GLOBAL_LEAGUE_ID } from "@/lib/db";
import { ensureCoreRows } from "@/lib/sync";

export const dynamic = "force-dynamic";

async function register(formData: FormData): Promise<void> {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email.includes("@") || password.length < 8 || name.length < 2) {
    redirect("/signup?error=bad_input");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/signup?error=taken");

  await ensureCoreRows();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });
  await prisma.membership.upsert({
    where: { userId_leagueId: { userId: user.id, leagueId: GLOBAL_LEAGUE_ID } },
    update: {},
    create: { userId: user.id, leagueId: GLOBAL_LEAGUE_ID },
  });

  await signIn("credentials", { email, password, redirectTo: "/leagues" });
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/leagues");
  const { error } = await searchParams;

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h1 className="font-display text-2xl font-bold">Create an account</h1>
      <p className="text-white/60 mt-1 text-sm">
        You&apos;ll be auto-enrolled in the Global League and stay signed in on this device.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-rim/40 bg-rim/10 px-3 py-2 text-sm text-rim">
          {error === "taken" ? "That email is already in use." : "Please check your details."}
        </div>
      )}

      <form action={register} className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Display name</span>
          <input name="name" className="input" required minLength={2} maxLength={40} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Email</span>
          <input name="email" type="email" className="input" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Password <span className="text-white/40">(min 8 chars)</span></span>
          <input name="password" type="password" className="input" required minLength={8} />
        </label>
        <button className="btn btn-primary" type="submit">Create account</button>
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
        Have an account? <Link href="/signin" className="text-banana-500 underline">Sign in</Link>
      </p>
    </div>
  );
}
