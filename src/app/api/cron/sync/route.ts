import { NextResponse } from "next/server";
import { runFullSyncTick } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron entry: schedule-refresh + monkey picks + lock + live-score refresh.
 * Protect with CRON_SECRET (header "x-cron-secret") when deployed.
 */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET) {
    const given = req.headers.get("x-cron-secret");
    if (given !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  await runFullSyncTick();
  return NextResponse.json({ ok: true });
}
