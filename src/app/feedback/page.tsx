import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function submit(formData: FormData): Promise<void> {
  "use server";
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const category = String(formData.get("category") ?? "other");
  const subject = String(formData.get("subject") ?? "").slice(0, 160) || null;
  const message = String(formData.get("message") ?? "").trim().slice(0, 4000);

  if (!["bug", "inquiry", "feature", "other"].includes(category)) {
    redirect("/feedback?error=bad_input");
  }
  if (message.length < 5) {
    redirect("/feedback?error=too_short");
  }

  await prisma.feedback.create({
    data: { userId, category, subject, message },
  });
  redirect("/feedback?sent=1");
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/feedback");
  const { error, sent } = await searchParams;

  const mine = session.user
    ? await prisma.feedback.findMany({
        where: { userId: (session.user as { id?: string }).id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="grid gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold">Report a bug · ask us anything</h1>
        <p className="text-white/60 text-sm mt-1">
          Found something broken, confused by a rule, have an idea? Tell us.
        </p>
      </div>

      {sent && (
        <div className="card border-banana-500/40 bg-banana-500/10 text-sm">
          <span className="text-banana-500 font-semibold">Got it.</span> We&apos;ll take a look.
        </div>
      )}
      {error && (
        <div className="card border-rim/40 bg-rim/10 text-sm text-rim">
          {error === "too_short" ? "Add a little more detail — at least a few words." : "Please check your submission."}
        </div>
      )}

      <form action={submit} className="card grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Category</span>
          <select name="category" className="input" defaultValue="bug">
            <option value="bug">Bug report</option>
            <option value="inquiry">Question / inquiry</option>
            <option value="feature">Feature idea</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Subject (optional)</span>
          <input name="subject" className="input" maxLength={160} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">What&apos;s going on?</span>
          <textarea
            name="message"
            className="input min-h-[160px] font-body"
            required
            minLength={5}
            maxLength={4000}
            placeholder="As much detail as you feel like giving. Screenshots? Paste a link."
          />
        </label>
        <button className="btn btn-primary" type="submit">Send</button>
      </form>

      {mine.length > 0 && (
        <section className="card">
          <h2 className="font-display text-xl font-bold">Your recent reports</h2>
          <ul className="mt-3 divide-y divide-ink-800/80">
            {mine.map((f) => (
              <li key={f.id} className="py-2 text-sm flex items-center gap-3">
                <span className={`badge ${f.status === "resolved" ? "bg-banana-500/20 text-banana-500" : "bg-ink-700 text-white/70"}`}>
                  {f.status}
                </span>
                <span className="uppercase tracking-wide text-xs text-white/50">{f.category}</span>
                <span className="truncate flex-1">{f.subject ?? f.message.slice(0, 80)}</span>
                <span className="text-xs text-white/40">{f.createdAt.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="text-center text-sm text-white/50">
        <Link href="/">← back to home</Link>
      </div>
    </div>
  );
}
