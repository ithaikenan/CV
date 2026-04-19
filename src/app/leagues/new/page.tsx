import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma, MONKEY_USER_ID } from "@/lib/db";

export default async function NewLeaguePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");

  async function create(formData: FormData) {
    "use server";
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return;
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) return;
    const league = await prisma.league.create({
      data: {
        name,
        ownerId: userId,
        memberships: { create: [{ userId }, { userId: MONKEY_USER_ID }] },
      },
    });
    redirect(`/leagues/${league.id}`);
  }

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="font-display text-2xl font-bold">Create a private league</h1>
      <p className="text-white/60 text-sm mt-1">
        You&apos;ll get an invite code to share with friends. The Monkey joins automatically.
      </p>
      <form action={create} className="mt-4 grid gap-3">
        <input name="name" className="input" placeholder="League name" required maxLength={40} />
        <button className="btn btn-primary" type="submit">Create</button>
      </form>
    </div>
  );
}
