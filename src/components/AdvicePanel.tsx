"use client";

import type { Recommendation } from "@/lib/types";

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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
          Analyzing the board…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!advice) return null;

  const { player, reason, fit, alternatives, notes, engine } = advice;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
          Suggested next pick
          <span className="ml-1.5 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {engine === "llm" ? "AI" : "value model"}
          </span>
        </p>
        <span className="text-xs tabular-nums text-zinc-500">val {player.value.toFixed(1)}</span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-zinc-950">
          {player.position}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-zinc-50">{player.full_name}</p>
          <p className="text-xs text-zinc-400">
            {player.team ? `${player.team} · ` : ""}
            {player.position}
            {player.status && player.status !== "Active" ? ` · ${player.status}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPick(player.player_id)}
          className="ml-auto shrink-0 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-95"
        >
          Draft
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{reason}</p>
      <p className="mt-1 text-xs text-zinc-500">{fit}</p>

      {alternatives.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Others to consider</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt.player_id}
                type="button"
                onClick={() => onPick(alt.player_id)}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 active:scale-95"
              >
                {alt.full_name} · {alt.position}
              </button>
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="mt-3 space-y-1">
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
