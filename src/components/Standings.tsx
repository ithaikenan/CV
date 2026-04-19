"use client";

import { useEffect, useState } from "react";

interface Row {
  userId: string;
  name: string;
  image: string | null;
  isMonkey: boolean;
  finalPoints: number;
  livePoints: number;
  totalPoints: number;
}

export function Standings({ leagueId }: { leagueId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const r = await fetch(`/api/standings/${leagueId}`, { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { rows: Row[] };
      if (!cancelled) setRows(j.rows);
    }
    tick();
    const id = setInterval(tick, 15000); // refresh every 15s for live view
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [leagueId]);

  if (!rows) return <div className="card text-white/60">Loading standings…</div>;
  if (rows.length === 0) return <div className="card text-white/60">No members yet.</div>;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Standings</h2>
        <span className="text-xs text-white/50">refreshes every 15s · live points update in real time</span>
      </div>
      <ol className="mt-3 divide-y divide-ink-800/80">
        {rows.map((r, i) => (
          <li key={r.userId} className="flex items-center gap-3 py-2">
            <span className="w-6 text-white/50 text-sm">{i + 1}</span>
            {r.image ? (
              <img src={r.image} className="h-8 w-8 rounded-full" alt="" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-ink-700 flex items-center justify-center text-sm">
                {r.isMonkey ? "🐒" : (r.name[0] ?? "?")}
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold">
                {r.name} {r.isMonkey && <span className="badge bg-banana-500/20 text-banana-500 ml-1">MONKEY</span>}
              </div>
              <div className="text-xs text-white/50">
                final {r.finalPoints} · live +{r.livePoints}
              </div>
            </div>
            <div className="font-display text-2xl font-black">{r.totalPoints}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
