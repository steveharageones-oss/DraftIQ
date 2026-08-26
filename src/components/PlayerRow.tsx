"use client";

import type { BoardPlayer } from "@/lib/types";
import { injuryInfo } from "@/lib/status";

const POS_PILL: Record<string, string> = {
  QB: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  RB: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  WR: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  TE: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  DEF: "border-slate-500/30 bg-slate-500/15 text-slate-300",
  K: "border-slate-500/30 bg-slate-500/15 text-slate-300",
};

const POS_COLOR: Record<string, string> = {
  QB: "bg-sky-400",
  RB: "bg-emerald-400",
  WR: "bg-rose-400",
  TE: "bg-amber-400",
  DEF: "bg-slate-400",
  K: "bg-slate-400",
};

const BADGE: Record<string, string> = {
  out: "bg-red-500/20 text-red-300",
  doubtful: "bg-orange-500/20 text-orange-300",
  q: "bg-amber-500/20 text-amber-300",
};

const BADGE_LABEL: Record<string, string> = {
  out: "Out",
  doubtful: "D",
  q: "Q",
};

export function PlayerRow({
  player,
  onPick,
  onTaken,
  onOpen,
}: {
  player: BoardPlayer;
  onPick: (player: BoardPlayer) => void;
  onTaken: (player: BoardPlayer) => void;
  onOpen: (player: BoardPlayer) => void;
}) {
  const inj = injuryInfo(player);
  const posColor = POS_COLOR[player.position] ?? "bg-slate-400";
  const posPill = POS_PILL[player.position] ?? "border-slate-500/30 bg-slate-500/15 text-slate-300";

  return (
    <li className="group flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-zinc-900/40">
      <span className="w-7 shrink-0 text-center text-xs font-bold tabular-nums text-zinc-600">
        {player.rank}
      </span>

      <span className={`h-8 w-1 shrink-0 rounded-full ${posColor} opacity-70`} />

      <button
        type="button"
        onClick={() => onOpen(player)}
        className="min-w-0 flex-1 text-left"
        aria-label={`View ${player.full_name}`}
      >
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-zinc-100">{player.full_name}</p>
          {inj.tone !== "none" && (
            <span
              className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE[inj.tone]}`}
              title={inj.part ? `${inj.label}${inj.part ? ` — ${inj.part}` : ""}` : inj.label ?? undefined}
            >
              {BADGE_LABEL[inj.tone]}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
          <span
            className={`inline-block shrink-0 rounded border px-1 py-px text-[9px] font-bold uppercase tracking-wider ${posPill}`}
          >
            {player.position}
          </span>
          <span className="truncate">
            {player.team ?? "—"}
            {player.age != null ? ` · Age ${player.age}` : ""}
          </span>
        </div>
      </button>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums text-zinc-200">{player.value.toFixed(1)}</p>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">val</p>
      </div>

      <div className="ml-1 flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onTaken(player)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 transition hover:bg-amber-500/25 active:scale-90"
          aria-label={`Mark ${player.full_name} taken by another team`}
          title="Taken by another team"
        >
          ⊘
        </button>
        <button
          type="button"
          onClick={() => onPick(player)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-lg font-medium text-zinc-950 shadow-md shadow-emerald-500/25 transition hover:from-emerald-300 hover:to-emerald-500 active:scale-90"
          aria-label={`Pick ${player.full_name}`}
          title="Pick for my team"
        >
          +
        </button>
      </div>
    </li>
  );
}
