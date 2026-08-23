import { useEffect, useState } from "react";

export type LeaguePlatform = "manual" | "espn" | "yahoo";

export interface LeagueDraftState {
  draftedIds: string[];
  otherTakenIds: string[];
}

export interface League {
  id: string;
  name: string;
  platform: LeaguePlatform;
  externalId?: string; // ESPN/Yahoo league id (auto-import, optional)
  season?: string;
  createdAt: number;
  draftState: LeagueDraftState;
}

const LEAGUES_KEY = "draftiq.leagues";
const ACTIVE_KEY = "draftiq.activeLeagueId";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `league-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultLeague(name = "My League", platform: LeaguePlatform = "manual"): League {
  return {
    id: newId(),
    name,
    platform,
    createdAt: Date.now(),
    draftState: { draftedIds: [], otherTakenIds: [] },
  };
}

function loadLeagues(): League[] {
  try {
    const raw = localStorage.getItem(LEAGUES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as League[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLeagues(leagues: League[]) {
  try {
    localStorage.setItem(LEAGUES_KEY, JSON.stringify(leagues));
  } catch {
    /* storage full/blocked; ignore */
  }
}

function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function saveActiveId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

export function useLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let list = loadLeagues();
    if (list.length === 0) list = [defaultLeague()];
    const savedActive = loadActiveId();
    const active = list.some((l) => l.id === savedActive) ? savedActive : list[0].id;
    setLeagues(list);
    setActiveId(active);
    setReady(true);
  }, []);

  const commit = (next: League[], nextActive: string) => {
    saveLeagues(next);
    saveActiveId(nextActive);
    setLeagues(next);
    setActiveId(nextActive);
  };

  const addLeague = (name: string, platform: LeaguePlatform, externalId?: string) => {
    const league = { ...defaultLeague(name, platform), externalId };
    commit([...leagues, league], league.id);
  };

  const selectLeague = (id: string) => {
    if (leagues.some((l) => l.id === id)) commit(leagues, id);
  };

  const renameLeague = (id: string, name: string) => {
    commit(
      leagues.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l)),
      activeId ?? leagues[0]?.id ?? "",
    );
  };

  const updateDraftState = (id: string, state: LeagueDraftState) => {
    commit(
      leagues.map((l) => (l.id === id ? { ...l, draftState: state } : l)),
      activeId ?? leagues[0]?.id ?? "",
    );
  };

  const deleteLeague = (id: string) => {
    const next = leagues.filter((l) => l.id !== id);
    if (next.length === 0) next.push(defaultLeague());
    const nextActive = activeId === id ? next[0].id : activeId ?? next[0].id;
    commit(next, nextActive);
  };

  const activeLeague = leagues.find((l) => l.id === activeId) ?? leagues[0] ?? null;
  const activeLeagueId = activeLeague?.id ?? null;

  return {
    leagues,
    activeLeague,
    activeLeagueId,
    ready,
    addLeague,
    selectLeague,
    renameLeague,
    updateDraftState,
    deleteLeague,
  };
}
