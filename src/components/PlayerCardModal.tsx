"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
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

interface PlayerInfo {
  ecr: string | null;
  adp: string | null;
  bestWorst: string | null;
  rostered: string | null;
  outlook: string | null;
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
  const [info, setInfo] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(player.page));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!player.page) {
      setLoading(false);
      setError("No outlook available for this player in the free feed.");
      return;
    }
    setLoading(true);
    setInfo(null);
    setError(null);
    fetch(`/api/player?page=${encodeURIComponent(player.page)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { ok: boolean } & Partial<PlayerInfo>) => {
        if (cancelled) return;
        setInfo({
          ecr: data.ecr ?? null,
          adp: data.adp ?? null,
          bestWorst: data.bestWorst ?? null,
          rostered: data.rostered ?? null,
          outlook: data.outlook ?? null,
        });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setError("Couldn't load the outlook right now.");
      });
    return () => {
      cancelled = true;
    };
  }, [player.player_id, player.page]);

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

        {/* Status chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-zinc-300">
            Rank #{player.rank}
          </span>
          {player.adp != null && (
            <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-zinc-300">
              ADP ~{player.adp.toFixed(1)}
            </span>
          )}
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

        {/* Expert consensus strip */}
        {info && (info.ecr || info.adp || info.bestWorst || info.rostered) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {info.ecr && <Chip label="Overall (ECR)" value={info.ecr} />}
            {info.adp && <Chip label="ADP" value={info.adp} />}
            {info.bestWorst && <Chip label="Best / Worst" value={info.bestWorst} />}
            {info.rostered && <Chip label="Rostered" value={info.rostered} />}
          </div>
        )}

        {/* Outlook */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Outlook</p>
          {loading ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
              Loading outlook…
            </div>
          ) : error ? (
            <p className="mt-1 text-sm text-zinc-400">{error}</p>
          ) : info?.outlook ? (
            <p className="mt-1 text-sm leading-relaxed text-zinc-200">{info.outlook}</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">
              No outlook available for this player in the free feed.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-100">{value}</p>
    </div>
  );
}
