import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/leagues");
  return (
    <div className="max-w-md mx-auto card mt-10">
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      <p className="text-white/60 mt-1 text-sm">We&apos;ll keep you logged in on this device.</p>
      <div className="mt-6 grid gap-3">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/leagues" });
          }}
        >
          <button className="btn btn-ghost w-full" type="submit">Continue with Google</button>
        </form>
        <form
          action={async () => {
            "use server";
            await signIn("facebook", { redirectTo: "/leagues" });
          }}
        >
          <button className="btn btn-primary w-full" type="submit">Continue with Facebook</button>
        </form>
      </div>
    </div>
  );
}
