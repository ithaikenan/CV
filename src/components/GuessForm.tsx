"use client";

import { useState, useTransition } from "react";

interface Props {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  locked: boolean;
  initialHome?: number;
  initialAway?: number;
}

export function GuessForm({ gameId, homeTeam, awayTeam, locked, initialHome, initialAway }: Props) {
  const [home, setHome] = useState<number | "">(initialHome ?? "");
  const [away, setAway] = useState<number | "">(initialAway ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    start(async () => {
      const r = await fetch("/api/guesses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gameId,
          homeScore: Number(home),
          awayScore: Number(away),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMsg(j.error === "locked" ? "Game started — picks are locked." : "Could not save.");
      else setMsg("Saved.");
    });
  }

  if (locked) {
    return (
      <div className="rounded-xl bg-ink-800/60 border border-ink-700 px-3 py-2 text-sm text-white/70">
        Locked · {initialHome != null && initialAway != null ? `your pick: ${awayTeam} ${initialAway} — ${initialHome} ${homeTeam}` : "you didn't pick"}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <label className="grid gap-1 text-xs text-white/60">
        <span>{awayTeam}</span>
        <input
          type="number"
          min={0}
          max={200}
          value={away}
          onChange={(e) => setAway(e.target.value === "" ? "" : Number(e.target.value))}
          className="input w-20"
        />
      </label>
      <span className="text-white/40 pb-2">@</span>
      <label className="grid gap-1 text-xs text-white/60">
        <span>{homeTeam}</span>
        <input
          type="number"
          min={0}
          max={200}
          value={home}
          onChange={(e) => setHome(e.target.value === "" ? "" : Number(e.target.value))}
          className="input w-20"
        />
      </label>
      <button
        className="btn btn-primary disabled:opacity-60"
        onClick={save}
        disabled={pending || home === "" || away === ""}
      >
        {pending ? "Saving…" : "Save pick"}
      </button>
      {msg && <span className="text-xs text-white/60">{msg}</span>}
    </div>
  );
}
