"use client";

import type { BoardPlayer } from "@/lib/types";

const POS_COLOR: Record<string, string> = {
  QB: "bg-sky-500",
  RB: "bg-emerald-500",
  WR: "bg-rose-500",
  TE: "bg-amber-500",
  DEF: "bg-slate-500",
  K: "bg-slate-500",
};

export function PlayerRow({
  player,
  onPick,
  onTaken,
}: {
  player: BoardPlayer;
  onPick: (player: BoardPlayer) => void;
  onTaken: (player: BoardPlayer) => void;
}) {
  const injured = Boolean(player.injury_status && player.injury_status !== "Active");
  const posColor = POS_COLOR[player.position] ?? "bg-slate-500";

  return (
    <li className="flex items-center gap-3 border-b border-zinc-800/60 px-3 py-2.5 last:border-0">
      <span className="w-8 shrink-0 text-center text-xs font-semibold tabular-nums text-zinc-500">
        {player.rank}
      </span>

      <span className={`h-6 w-1 rounded-full ${posColor}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-zinc-100">{player.full_name}</p>
          {injured && (
            <span className="shrink-0 rounded bg-red-500/20 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
              Out
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {player.position}
          {player.team ? ` · ${player.team}` : ""}
          {player.age != null ? ` · ${player.age}` : ""}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-zinc-200">{player.value.toFixed(1)}</p>
        <p className="text-[10px] text-zinc-600">value</p>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onTaken(player)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
          aria-label={`Mark ${player.full_name} taken by another team`}
          title="Taken by another team"
        >
          ⊘
        </button>
        <button
          type="button"
          onClick={() => onPick(player)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-lg font-medium text-zinc-950 transition hover:bg-emerald-400 active:scale-95"
          aria-label={`Pick ${player.full_name}`}
          title="Pick for my team"
        >
          +
        </button>
      </div>
    </li>
  );
}
