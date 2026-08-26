"use client";

import { useCallback, useState } from "react";
import { useLeagues, type LeaguePlatform } from "@/lib/leagues";
import type { RosterSlotCounts } from "@/lib/types";
import { DraftApp } from "./DraftApp";

const PLATFORM_LABEL: Record<LeaguePlatform, string> = {
  manual: "Manual",
  espn: "ESPN",
  yahoo: "Yahoo",
};

const PLATFORM_COLOR: Record<LeaguePlatform, string> = {
  manual: "bg-zinc-700",
  espn: "bg-red-500",
  yahoo: "bg-purple-500",
};

export function AppShell() {
  const {
    leagues,
    activeLeague,
    activeLeagueId,
    ready,
    addLeague,
    selectLeague,
    renameLeague,
    updateDraftState,
    resetLeague,
    deleteLeague,
    updateLeagueSettings,
  } = useLeagues();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<LeaguePlatform>("manual");
  const [externalId, setExternalId] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const resetConfirm = () => {
    if (!activeLeague) return;
    if (!window.confirm(`Reset "${activeLeague.name}"? This clears this league's picks.`)) return;
    resetLeague(activeLeague.id);
    setResetNonce((n) => n + 1);
  };

  const deleteConfirm = () => {
    if (!activeLeague) return;
    if (!window.confirm(`Delete "${activeLeague.name}"? This can't be undone.`)) return;
    deleteLeague(activeLeague.id);
  };

  const setSlot = (key: keyof RosterSlotCounts, raw: string) => {
    if (!activeLeague) return;
    const v = Math.max(0, Math.min(15, Number(raw) || 0));
    updateLeagueSettings(activeLeague.id, { slots: { ...activeLeague.slots, [key]: v } });
  };

  const setPpr = (v: number) => {
    if (!activeLeague) return;
    updateLeagueSettings(activeLeague.id, { ppr: v });
  };

  const persistState = useCallback(
    (state: { draftedIds: string[]; otherTakenIds: string[] }) => {
      if (activeLeagueId) updateDraftState(activeLeagueId, state);
    },
    [activeLeagueId, updateDraftState],
  );

  const submitAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const ext = platform === "manual" ? undefined : externalId.trim() || undefined;
    addLeague(trimmed, platform, ext);
    setName("");
    setPlatform("manual");
    setExternalId("");
    setShowAdd(false);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28">
      {/* League switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-3">
        {leagues.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => selectLeague(l.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              l.id === activeLeagueId
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-500/10"
                : "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${PLATFORM_COLOR[l.platform]}`} />
            <span className="max-w-[9rem] truncate">{l.name}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="shrink-0 rounded-full border border-dashed border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:text-zinc-100"
        >
          + Add
        </button>
      </div>

      {/* Add league form */}
      {showAdd && (
        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <label className="block text-xs font-medium text-zinc-400">League name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yahoo Work League 2025"
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
          />

          <label className="mt-3 block text-xs font-medium text-zinc-400">Platform</label>
          <div className="mt-1 flex gap-2">
            {(["manual", "espn", "yahoo"] as LeaguePlatform[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  platform === p
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                    : "border-transparent bg-zinc-900/70 text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>

          {platform !== "manual" && (
            <>
              <label className="mt-3 block text-xs font-medium text-zinc-400">
                {platform === "espn" ? "ESPN league ID (optional)" : "Yahoo league ID (optional)"}
              </label>
              <input
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="Leave blank to track manually"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
              />
              <p className="mt-1 text-[11px] text-zinc-600">
                Auto-import is a bonus. You can leave this blank now and track by hand.
              </p>
            </>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submitAdd}
              disabled={!name.trim()}
              className="rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-bold text-zinc-950 shadow-md shadow-emerald-500/25 transition hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40 disabled:shadow-none"
            >
              Add league
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active league header */}
      {activeLeague && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${PLATFORM_COLOR[activeLeague.platform]}`} />
            {renaming ? (
              <input
                autoFocus
                defaultValue={activeLeague.name}
                onBlur={() => setRenaming(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameLeague(activeLeague.id, (e.target as HTMLInputElement).value);
                    setRenaming(false);
                  }
                }}
                className="rounded-md border border-emerald-500 bg-zinc-950 px-2 py-0.5 text-sm text-zinc-100 outline-none"
              />
            ) : (
              <h2 className="text-base font-semibold text-zinc-100">{activeLeague.name}</h2>
            )}
            <button
              type="button"
              onClick={() => setRenaming((r) => !r)}
              className="text-xs text-zinc-500 hover:text-zinc-200"
              aria-label="Rename league"
            >
              ✎
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className="text-[11px] text-zinc-500 transition hover:text-emerald-300"
            >
              ⚙ Settings
            </button>
            <button
              type="button"
              onClick={resetConfirm}
              className="text-[11px] text-zinc-500 transition hover:text-zinc-200"
            >
              ↺ Reset
            </button>
            <button
              type="button"
              onClick={deleteConfirm}
              className="text-[11px] text-zinc-500 transition hover:text-red-400"
            >
              Delete
            </button>
            <span className="text-[11px] text-zinc-600">{PLATFORM_LABEL[activeLeague.platform]}</span>
          </div>
        </div>
      )}

      {/* League settings */}
      {activeLeague && showSettings && (
        <div className="mt-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300">Roster & scoring</p>
            <button type="button" onClick={() => setShowSettings(false)} className="text-xs text-zinc-500 hover:text-zinc-200">
              Done
            </button>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {(["QB", "RB", "WR", "TE", "FLEX"] as const).map((k) => (
              <label key={k} className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wide text-zinc-500">{k}</span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={activeLeague.slots[k]}
                  onChange={(e) => setSlot(k, e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-center text-sm tabular-nums text-zinc-100 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                />
              </label>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-zinc-400">Scoring (points per reception)</p>
            <div className="mt-1.5 flex gap-2">
              {[
                { label: "Standard (0)", v: 0 },
                { label: "0.5 PPR", v: 0.5 },
                { label: "Full PPR (1)", v: 1 },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setPpr(o.v)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeLeague.ppr === o.v
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                      : "border-transparent bg-zinc-900/70 text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Draft workspace for the active league */}
      {ready && activeLeague && (
        <DraftApp
          key={`${activeLeague.id}-${resetNonce}`}
          league={activeLeague}
          onStateChange={persistState}
        />
      )}
    </div>
  );
}
