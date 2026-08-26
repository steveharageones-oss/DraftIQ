"use client";

import { useState } from "react";
import type { BoardPlayer, RosterSlotCounts } from "@/lib/types";
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
    <div
      className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 transition ${
        player
          ? "border-zinc-800 bg-zinc-900/70"
          : "border-dashed border-zinc-800 bg-zinc-950/40"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
        {player ? (
          <p className="truncate text-sm font-medium text-zinc-100">{player.full_name}</p>
        ) : (
          <p className="text-sm text-zinc-600">Empty</p>
        )}
      </div>
      {player && (
        <button
          type="button"
          onClick={() => onRemove(player.player_id)}
          className="ml-2 shrink-0 text-zinc-600 transition hover:text-red-400"
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
  slots,
}: {
  drafted: BoardPlayer[];
  onRemove: (id: string) => void;
  slots?: RosterSlotCounts;
}) {
  const [open, setOpen] = useState(false);
  const s = slots ?? DEFAULT_ROSTER_SLOTS;
  const lineup = buildLineup(drafted, s);
  const complete = isLineupComplete(lineup, s);
  const hasAny = drafted.length > 0;

  const totalStarters = s.QB + s.RB + s.WR + s.TE + s.FLEX;
  const filledStarters = [
    lineup.QB,
    ...lineup.RB,
    ...lineup.WR,
    lineup.TE,
    ...lineup.FLEX,
  ].filter(Boolean).length;

  const groups = [
    { label: "QB", have: lineup.QB ? 1 : 0, need: s.QB },
    { label: "RB", have: lineup.RB.length, need: s.RB },
    { label: "WR", have: lineup.WR.length, need: s.WR },
    { label: "TE", have: lineup.TE ? 1 : 0, need: s.TE },
    { label: "FLEX", have: lineup.FLEX.length, need: s.FLEX },
  ].filter((g) => g.need > 0);

  const chipTone = (have: number, need: number) =>
    have >= need
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : have > 0
        ? "border-zinc-700 bg-zinc-900 text-zinc-200"
        : "border-zinc-800 bg-zinc-950/60 text-zinc-600";

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-xl shadow-black/20 backdrop-blur-sm">
      {/* Header — always visible, tap to expand/collapse */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            My Team
          </span>
          {complete && (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
              Complete ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-zinc-500">
            {filledStarters}/{totalStarters} starters
            {lineup.bench.length > 0 ? ` · ${lineup.bench.length} bench` : ""}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-4">
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{
              width: `${totalStarters ? Math.min(100, (filledStarters / totalStarters) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {!open ? (
        /* Collapsed: compact chips, one glance */
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 pt-2.5">
          {hasAny ? (
            <>
              {groups.map((g) => (
                <span
                  key={g.label}
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums ${chipTone(g.have, g.need)}`}
                >
                  {g.label} {g.have}/{g.need}
                </span>
              ))}
              {lineup.bench.length > 0 && (
                <span className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[11px] font-semibold tabular-nums text-zinc-500">
                  BN {lineup.bench.length}
                </span>
              )}
            </>
          ) : (
            <p className="text-xs leading-relaxed text-zinc-500">
              Tap <span className="font-semibold text-emerald-400">＋</span> to draft a player ·{" "}
              <span className="font-semibold text-amber-300">⊘</span> marks picks by other teams
            </p>
          )}
        </div>
      ) : (
        /* Expanded: full lineup + bench */
        <div className="px-4 pb-4 pt-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Slot label="QB" player={lineup.QB} onRemove={onRemove} />
            {lineup.RB.map((p, i) => (
              <Slot key={p.player_id} label={`RB${i + 1}`} player={p} onRemove={onRemove} />
            ))}
            {lineup.WR.map((p, i) => (
              <Slot key={p.player_id} label={`WR${i + 1}`} player={p} onRemove={onRemove} />
            ))}
            <Slot label="TE" player={lineup.TE} onRemove={onRemove} />
            {lineup.FLEX.map((p, i) => (
              <Slot key={p.player_id} label={`FLEX ${i + 1}`} player={p} onRemove={onRemove} />
            ))}
          </div>

          {lineup.bench.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Bench
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {lineup.bench.map((p) => (
                  <button
                    key={p.player_id}
                    type="button"
                    onClick={() => onRemove(p.player_id)}
                    className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-xs text-zinc-400 transition hover:border-red-500/40 hover:text-red-300"
                  >
                    {p.full_name} ✕
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
