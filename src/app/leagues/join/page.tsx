import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function JoinLeaguePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");

  async function join(formData: FormData) {
    "use server";
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return;
    const code = String(formData.get("code") ?? "").trim();
    const league = await prisma.league.findUnique({ where: { inviteCode: code } });
    if (!league) return;
    await prisma.membership.upsert({
      where: { userId_leagueId: { userId, leagueId: league.id } },
      update: {},
      create: { userId, leagueId: league.id },
    });
    redirect(`/leagues/${league.id}`);
  }

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="font-display text-2xl font-bold">Join a private league</h1>
      <form action={join} className="mt-4 grid gap-3">
        <input name="code" className="input" placeholder="Invite code" required />
        <button className="btn btn-primary" type="submit">Join</button>
      </form>
    </div>
  );
}
