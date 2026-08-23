"use client";

import type { BoardPlayer } from "@/lib/types";
import { DEFAULT_ROSTER_SLOTS } from "@/lib/types";
import { buildLineup, isLineupComplete } from "@/lib/lineup";

function Slot({
  label,
  player,
  onRemove,
}: {
  label: string;
  player: BoardPlayer | null;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-2.5 py-1.5">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
        {player ? (
          <p className="truncate text-sm text-zinc-100">{player.full_name}</p>
        ) : (
          <p className="text-sm text-zinc-600">— empty —</p>
        )}
      </div>
      {player && (
        <button
          type="button"
          onClick={() => onRemove(player.player_id)}
          className="ml-2 shrink-0 text-zinc-500 transition hover:text-red-400"
          aria-label={`Remove ${player.full_name}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function MyTeam({
  drafted,
  onRemove,
}: {
  drafted: BoardPlayer[];
  onRemove: (id: string) => void;
}) {
  const lineup = buildLineup(drafted, DEFAULT_ROSTER_SLOTS);
  const complete = isLineupComplete(lineup, DEFAULT_ROSTER_SLOTS);
  const hasAny = drafted.length > 0;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">My Team</h2>
        <span className={`text-xs ${complete ? "text-emerald-400" : "text-zinc-500"}`}>
          {complete ? "Lineup complete ✓" : `${drafted.length} pick${drafted.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {!hasAny ? (
        <p className="mt-3 text-xs text-zinc-500">
          Tap <span className="text-emerald-400">＋</span> on a player to put them on your team.
          Use <span className="text-amber-300">⊘</span> to mark players another team already
          took (they leave the board).
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Slot label="QB" player={lineup.QB} onRemove={onRemove} />
          {lineup.RB.map((p, i) => (
            <Slot key={p.player_id} label={`RB${i + 1}`} player={p} onRemove={onRemove} />
          ))}
          {lineup.WR.map((p, i) => (
            <Slot key={p.player_id} label={`WR${i + 1}`} player={p} onRemove={onRemove} />
          ))}
          <Slot label="TE" player={lineup.TE} onRemove={onRemove} />
          {lineup.FLEX && <Slot label="FLEX" player={lineup.FLEX} onRemove={onRemove} />}
        </div>
      )}

      {lineup.bench.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Bench</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {lineup.bench.map((p) => (
              <button
                key={p.player_id}
                type="button"
                onClick={() => onRemove(p.player_id)}
                className="text-xs text-zinc-400 underline-offset-2 hover:text-red-400 hover:underline"
              >
                {p.full_name} ✕
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
