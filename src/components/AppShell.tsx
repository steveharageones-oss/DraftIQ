"use client";

import { useCallback, useState } from "react";
import { useLeagues, type LeaguePlatform } from "@/lib/leagues";
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
  } = useLeagues();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<LeaguePlatform>("manual");
  const [externalId, setExternalId] = useState("");
  const [renaming, setRenaming] = useState(false);

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
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100"
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
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />

          <label className="mt-3 block text-xs font-medium text-zinc-400">Platform</label>
          <div className="mt-1 flex gap-2">
            {(["manual", "espn", "yahoo"] as LeaguePlatform[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  platform === p
                    ? "bg-zinc-100 text-zinc-950"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-100"
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
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
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
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
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
          <span className="ml-auto text-[11px] text-zinc-600">{PLATFORM_LABEL[activeLeague.platform]}</span>
        </div>
      )}

      {/* Draft workspace for the active league */}
      {ready && activeLeague && (
        <DraftApp
          key={activeLeague.id}
          league={activeLeague}
          onStateChange={persistState}
        />
      )}
    </div>
  );
}
