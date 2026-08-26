"use client";

import type { Recommendation } from "@/lib/types";

const POS_PILL: Record<string, string> = {
  QB: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  RB: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  WR: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  TE: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  DEF: "border-slate-500/30 bg-slate-500/15 text-slate-300",
  K: "border-slate-500/30 bg-slate-500/15 text-slate-300",
};

export function AdvicePanel({
  advice,
  loading,
  error,
  onPick,
}: {
  advice: Recommendation | null;
  loading: boolean;
  error: string | null;
  onPick: (playerId: string) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 text-sm text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Analyzing the board…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!advice) return null;

  const { player, reason, fit, alternatives, notes, engine } = advice;
  const posPill = POS_PILL[player.position] ?? "border-slate-500/30 bg-slate-500/15 text-slate-300";

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 via-zinc-900/50 to-zinc-900/40 shadow-lg shadow-emerald-950/30 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 pt-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
            <path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" />
          </svg>
          Suggested next pick
        </p>
        <span className="rounded-full bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
          {engine === "llm" ? "AI" : "value model"}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-3 px-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xs font-black uppercase ${posPill}`}
        >
          {player.position}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold leading-tight text-zinc-50">
            {player.full_name}
          </p>
          <p className="text-xs text-zinc-500">
            {player.team ? `${player.team} · ` : ""}
            {player.position}
            {player.status && player.status !== "Active" ? ` · ${player.status}` : ""}
            {" · "}
            <span className="tabular-nums text-zinc-400">val {player.value.toFixed(1)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPick(player.player_id)}
          className="shrink-0 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-bold text-zinc-950 shadow-md shadow-emerald-500/25 transition hover:from-emerald-300 hover:to-emerald-500 active:scale-95"
        >
          Draft
        </button>
      </div>

      <p className="mt-3 px-4 text-sm leading-relaxed text-zinc-300">{reason}</p>
      <p className="mt-1 px-4 pb-1 text-xs text-zinc-500">{fit}</p>

      {alternatives.length > 0 && (
        <div className="mt-2 px-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Others to consider
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 pb-1">
            {alternatives.map((alt) => (
              <button
                key={alt.player_id}
                type="button"
                onClick={() => onPick(alt.player_id)}
                className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 active:scale-95"
              >
                {alt.full_name} · {alt.position}
              </button>
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="mt-1 space-y-1 px-4 pb-4">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2 text-xs text-zinc-500">
              <span className="text-zinc-600">•</span>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
