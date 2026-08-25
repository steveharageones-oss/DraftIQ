"use client";

import { createPortal } from "react-dom";
import type { BoardPlayer } from "@/lib/types";
import { injuryInfo } from "@/lib/status";

const POS_COLOR: Record<string, string> = {
  QB: "bg-sky-500",
  RB: "bg-emerald-500",
  WR: "bg-rose-500",
  TE: "bg-amber-500",
  DEF: "bg-slate-500",
  K: "bg-slate-500",
};

function outlookFromRank(rank: number): string {
  if (rank <= 5) return "Elite — an early first-round pick.";
  if (rank <= 12) return "Round 1 — a top-tier starter.";
  if (rank <= 24) return "Round 2 — a clear everyday starter.";
  if (rank <= 48) return "Rounds 3–5 — a solid starter.";
  if (rank <= 100) return "Mid-round — starter / bench depth.";
  return "Late-round — value, bench depth, or a sleeper.";
}

export function PlayerCardModal({
  player,
  onClose,
}: {
  player: BoardPlayer;
  onClose: () => void;
}) {
  const inj = injuryInfo(player);
  const posColor = POS_COLOR[player.position] ?? "bg-slate-500";

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-zinc-950 ${posColor}`}
          >
            {player.position}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-zinc-50">{player.full_name}</h3>
            <p className="text-xs text-zinc-500">
              {player.team ? `${player.team} · ` : ""}
              {player.position}
              {player.age != null ? ` · ${player.age}y` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-zinc-500 transition hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Status */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-zinc-300`}
          >
            Rank #{player.rank}
          </span>
          {player.adp != null ? (
            <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-zinc-300">
              ADP ~{player.adp.toFixed(1)}
            </span>
          ) : null}
          <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-zinc-300">
            Value {player.value.toFixed(1)}
          </span>
          {inj.tone !== "none" && (
            <span
              className={`rounded px-2 py-1 text-[11px] font-semibold ${
                inj.tone === "out"
                  ? "bg-red-500/20 text-red-300"
                  : inj.tone === "doubtful"
                    ? "bg-orange-500/20 text-orange-300"
                    : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {inj.label}
              {inj.part ? ` — ${inj.part}` : ""}
            </span>
          )}
        </div>

        {/* Outlook */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            This-season outlook
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-200">
            {outlookFromRank(player.rank)}
          </p>
        </div>

        {/* Last season */}
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Last season
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Deep stats (last-season numbers and projections) aren&apos;t in the free data feed yet —
            this card shows rank, ADP, and outlook. I can wire a full stats feed (e.g., FantasyPros
            API) if you&apos;d like actual numbers.
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
