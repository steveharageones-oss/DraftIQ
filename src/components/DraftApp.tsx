"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BoardPlayer, Recommendation } from "@/lib/types";
import type { League } from "@/lib/leagues";
import { PlayerRow } from "./PlayerRow";
import { AdvicePanel } from "./AdvicePanel";
import { MyTeam } from "./MyTeam";

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE"] as const;
type PosFilter = (typeof POSITIONS)[number];

function slotTemplate(slots: League["slots"], ppr: number): string {
  const pprLabel = ppr >= 1 ? "full PPR" : ppr > 0 ? `${ppr} PPR` : `standard (${ppr} PPR)`;
  return `${slots.QB} QB · ${slots.RB} RB · ${slots.WR} WR · ${slots.TE} TE · ${slots.FLEX} FLEX · ${pprLabel}`;
}

export function DraftApp({
  league,
  onStateChange,
}: {
  league: League;
  onStateChange: (state: { draftedIds: string[]; otherTakenIds: string[] }) => void;
}) {
  const [board, setBoard] = useState<BoardPlayer[]>([]);
  const [boardSource, setBoardSource] = useState<"builtin" | "espn" | "custom">("builtin");
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [draftedIds, setDraftedIds] = useState<string[]>(league.draftState.draftedIds);
  const [otherTakenIds, setOtherTakenIds] = useState<string[]>(league.draftState.otherTakenIds);
  const [activePos, setActivePos] = useState<PosFilter>("ALL");
  const [showTaken, setShowTaken] = useState(false);
  const [advice, setAdvice] = useState<Recommendation | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    setLoadingBoard(true);
    setBoardError(null);
    try {
      const res = await fetch("/api/players", { cache: "no-store" });
      if (!res.ok) throw new Error("Bad response");
      const data: { board: BoardPlayer[]; source: "builtin" | "espn" | "custom" } = await res.json();
      setBoard(data.board);
      setBoardSource(data.source);
    } catch {
      setBoardError("Couldn't load the draft board. Check your connection and retry.");
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const playerById = useMemo(() => {
    const m = new Map<string, BoardPlayer>();
    for (const p of board) m.set(p.player_id, p);
    return m;
  }, [board]);

  // Availability = everything not on your team and not taken by another team.
  const unavailable = useMemo(
    () => new Set([...draftedIds, ...otherTakenIds]),
    [draftedIds, otherTakenIds],
  );
  const available = useMemo(
    () => board.filter((p) => !unavailable.has(p.player_id)),
    [board, unavailable],
  );

  const visible = useMemo(() => {
    if (activePos === "ALL") return available;
    return available.filter((p) => p.position === activePos);
  }, [available, activePos]);

  const draftedPlayers = useMemo(
    () => draftedIds.map((id) => playerById.get(id)).filter((p): p is BoardPlayer => Boolean(p)),
    [draftedIds, playerById],
  );

  const takenPlayers = useMemo(
    () => otherTakenIds.map((id) => playerById.get(id)).filter((p): p is BoardPlayer => Boolean(p)),
    [otherTakenIds, playerById],
  );

  // Core advice call — takes explicit ids so it never reads stale state.
  const doSuggest = useCallback(
    async (drafted: string[], unavailableIds: string[]) => {
      if (drafted.length === 0) return;
      setAdviceLoading(true);
      setAdviceError(null);
      try {
        const res = await fetch("/api/advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draftedPlayerIds: drafted,
            unavailablePlayerIds: unavailableIds,
            slots: league.slots,
            scoring: { ppr: league.ppr },
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Bad response");
        }
        const data: { recommendation: Recommendation } = await res.json();
        setAdvice(data.recommendation);
      } catch {
        setAdviceError("Couldn't get a suggestion this time. Please retry.");
      } finally {
        setAdviceLoading(false);
      }
    },
    [league.slots, league.ppr],
  );

  const pick = useCallback(
    (playerId: string) => {
      const draftedNext = draftedIds.includes(playerId) ? draftedIds : [...draftedIds, playerId];
      const unavailableNext = [...new Set([...draftedNext, ...otherTakenIds])];
      setDraftedIds(draftedNext);
      setAdvice(null);
      setAdviceError(null);
      onStateChange({ draftedIds: draftedNext, otherTakenIds });
      void doSuggest(draftedNext, unavailableNext);
    },
    [draftedIds, otherTakenIds, doSuggest, onStateChange],
  );

  const markTaken = useCallback(
    (playerId: string) => {
      if (draftedIds.includes(playerId) || otherTakenIds.includes(playerId)) return;
      const otherNext = [...otherTakenIds, playerId];
      const unavailableNext = [...new Set([...draftedIds, ...otherNext])];
      setOtherTakenIds(otherNext);
      setAdvice(null);
      setAdviceError(null);
      onStateChange({ draftedIds, otherTakenIds: otherNext });
      void doSuggest(draftedIds, unavailableNext);
    },
    [draftedIds, otherTakenIds, doSuggest, onStateChange],
  );

  const removeMyPick = useCallback(
    (playerId: string) => {
      const next = draftedIds.filter((x) => x !== playerId);
      setDraftedIds(next);
      setAdvice(null);
      setAdviceError(null);
      onStateChange({ draftedIds: next, otherTakenIds });
    },
    [draftedIds, otherTakenIds, onStateChange],
  );

  const removeTaken = useCallback(
    (playerId: string) => {
      const next = otherTakenIds.filter((x) => x !== playerId);
      setOtherTakenIds(next);
      setAdvice(null);
      setAdviceError(null);
      onStateChange({ draftedIds, otherTakenIds: next });
    },
    [draftedIds, otherTakenIds, onStateChange],
  );

  const handleSuggestTap = () => {
    void doSuggest(draftedIds, [...unavailable]);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28">
      <MyTeam drafted={draftedPlayers} onRemove={removeMyPick} slots={league.slots} />

      {/* Suggest */}
      <div className="mt-4">
        <button
          type="button"
          disabled={draftedIds.length === 0 || adviceLoading}
          onClick={handleSuggestTap}
          className="w-full rounded-xl bg-emerald-500 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {adviceLoading ? "Thinking…" : "Suggest my next pick"}
        </button>
        <p className="mt-2 text-center text-[11px] text-zinc-600">
          {slotTemplate(league.slots, league.ppr)} ·{" "}
          {boardSource === "custom"
            ? "FantasyPros consensus active"
            : boardSource === "espn"
              ? "expert ADP active"
              : "built-in value model"}
        </p>
      </div>

      <div className="mt-3">
        <AdvicePanel advice={advice} loading={adviceLoading} error={adviceError} onPick={pick} />
      </div>

      {/* Position filter */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => setActivePos(pos)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activePos === pos
                ? "bg-zinc-100 text-zinc-950"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Board */}
      {loadingBoard ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : boardError ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {boardError}
          <button type="button" onClick={() => void loadBoard()} className="mt-2 block text-red-200 underline">
            Retry
          </button>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs text-zinc-500">
            {visible.length} player{visible.length === 1 ? "" : "s"} available
            {otherTakenIds.length > 0 ? ` · ${otherTakenIds.length} taken` : ""}
          </p>
          <ul className="mt-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40">
            {visible.map((p) => (
              <PlayerRow
                key={p.player_id}
                player={p}
                onPick={(pl) => pick(pl.player_id)}
                onTaken={(pl) => markTaken(pl.player_id)}
              />
            ))}
            {visible.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-zinc-500">
                {activePos !== "ALL" ? "Everyone at this position is taken." : "No players left on the board."}
              </li>
            )}
          </ul>

          {/* Taken by others */}
          {otherTakenIds.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowTaken((s) => !s)}
                className="flex w-full items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-300"
              >
                <span>Taken by other teams ({otherTakenIds.length})</span>
                <span className="text-xs">{showTaken ? "Hide" : "Show"}</span>
              </button>
              {showTaken && (
                <ul className="mt-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
                  {takenPlayers.map((p) => (
                    <li
                      key={p.player_id}
                      className="flex items-center justify-between border-b border-zinc-800/60 px-3 py-2 last:border-0"
                    >
                      <span className="truncate text-sm text-zinc-400 line-through decoration-zinc-600">
                        {p.full_name}{" "}
                        <span className="not-italic text-zinc-600">({p.position})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTaken(p.player_id)}
                        className="ml-2 shrink-0 text-xs text-zinc-500 hover:text-emerald-400"
                      >
                        Undo
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
