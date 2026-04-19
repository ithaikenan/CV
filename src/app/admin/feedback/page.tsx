import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function setStatus(formData: FormData): Promise<void> {
  "use server";
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["open", "resolved"].includes(status)) return;
  await prisma.feedback.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
  });
  redirect("/admin/feedback");
}

async function setNote(formData: FormData): Promise<void> {
  "use server";
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return;
  const id = String(formData.get("id") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").slice(0, 2000);
  if (!id) return;
  await prisma.feedback.update({ where: { id }, data: { adminNote } });
  redirect("/admin/feedback");
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (!isAdminEmail(session.user.email)) {
    return (
      <div className="card max-w-md mx-auto mt-10">
        <h1 className="font-display text-2xl font-bold">Not authorized</h1>
      </div>
    );
  }
  const { filter } = await searchParams;
  const f = filter === "resolved" ? "resolved" : filter === "all" ? "all" : "open";

  const where = f === "all" ? {} : { status: f };
  const items = await prisma.feedback.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { name: true, email: true, image: true } } },
    take: 100,
  });

  const [openCount, resolvedCount] = await Promise.all([
    prisma.feedback.count({ where: { status: "open" } }),
    prisma.feedback.count({ where: { status: "resolved" } }),
  ]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/admin" className="text-sm text-white/60 hover:text-white">← back to admin</Link>
          <h1 className="font-display text-3xl font-bold mt-1">Feedback</h1>
          <div className="text-white/60 text-sm">
            {openCount} open · {resolvedCount} resolved
          </div>
        </div>
        <div className="flex gap-2">
          {(["open", "resolved", "all"] as const).map((s) => (
            <Link
              key={s}
              href={`/admin/feedback?filter=${s}`}
              className={`btn ${f === s ? "btn-primary" : "btn-ghost"}`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 && (
        <div className="card text-white/60">Nothing here.</div>
      )}

      <ul className="grid gap-3">
        {items.map((fb) => (
          <li key={fb.id} className="card">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className={`badge ${fb.status === "resolved" ? "bg-banana-500/20 text-banana-500" : "bg-rim/20 text-rim"}`}>
                    {fb.status}
                  </span>
                  <span className="uppercase tracking-wide">{fb.category}</span>
                  <span>·</span>
                  <span>{fb.createdAt.toLocaleString()}</span>
                </div>
                <h3 className="font-display text-lg font-bold mt-1">
                  {fb.subject ?? fb.message.slice(0, 80)}
                </h3>
                <pre className="whitespace-pre-wrap font-body text-white/80 text-sm mt-2">
                  {fb.message}
                </pre>
                <div className="text-xs text-white/50 mt-2">
                  from {fb.user?.name ?? fb.user?.email ?? "—"} {fb.user?.email && `(${fb.user.email})`}
                </div>

                <form action={setNote} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={fb.id} />
                  <label className="grid gap-1 text-xs">
                    <span className="text-white/60">Admin note (internal)</span>
                    <textarea
                      name="adminNote"
                      className="input min-h-[60px] font-body text-sm"
                      defaultValue={fb.adminNote ?? ""}
                      maxLength={2000}
                    />
                  </label>
                  <button className="btn btn-ghost w-fit" type="submit">Save note</button>
                </form>
              </div>

              <form action={setStatus} className="flex flex-col gap-2 min-w-[140px]">
                <input type="hidden" name="id" value={fb.id} />
                {fb.status === "open" ? (
                  <button
                    type="submit"
                    name="status"
                    value="resolved"
                    className="btn btn-primary"
                  >
                    Mark resolved
                  </button>
                ) : (
                  <button
                    type="submit"
                    name="status"
                    value="open"
                    className="btn btn-ghost"
                  >
                    Re-open
                  </button>
                )}
                {fb.resolvedAt && (
                  <div className="text-xs text-white/50">
                    resolved {fb.resolvedAt.toLocaleDateString()}
                  </div>
                )}
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
