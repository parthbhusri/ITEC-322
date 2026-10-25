"use client";

import { useSyncExternalStore } from "react";
import { api } from "./api";

// Saved items.
// - Logged in: stored on the account (backend /api/favorites), so they
//   follow the student to any device.
// - Logged out: kept in this browser, and moved onto the account the
//   next time they log in.

const STORAGE_KEY = "campus-rental-hub:favorites";
const EMPTY: Set<string> = new Set();

let ids: Set<string> = EMPTY;
let onAccount = false;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setIds(next: Set<string>) {
  ids = next;
  emit();
}

function readLocal(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeLocal(next: Set<string>) {
  try {
    if (next.size === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // Storage blocked (private mode): keep them in memory only
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  ids = readLocal();
  // Keep other tabs in step while logged out
  window.addEventListener("storage", (e) => {
    if (!onAccount && e.key === STORAGE_KEY) setIds(readLocal());
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called by the login state whenever someone logs in or out. */
export async function syncFavoritesWithAccount(loggedIn: boolean) {
  start();
  if (!loggedIn) {
    onAccount = false;
    setIds(readLocal());
    return;
  }

  try {
    const local = readLocal();
    const saved = new Set((await api.favorites()).map(String));
    // Move anything saved while logged out onto the account
    await Promise.all(
      [...local]
        .filter((id) => !saved.has(id))
        .map((id) =>
          api
            .addFavorite(id)
            .then(() => saved.add(id))
            .catch(() => undefined)
        )
    );
    writeLocal(new Set());
    onAccount = true;
    setIds(saved);
  } catch {
    // Couldn't reach the server: fall back to this browser's list
    onAccount = false;
    setIds(readLocal());
  }
}

export async function toggleFavorite(id: string) {
  start();
  const wasSaved = ids.has(id);
  const next = new Set(ids);
  if (wasSaved) next.delete(id);
  else next.add(id);
  setIds(next);

  if (!onAccount) {
    writeLocal(next);
    return;
  }

  try {
    if (wasSaved) await api.removeFavorite(id);
    else await api.addFavorite(id);
  } catch {
    // Undo if the server refused
    const undo = new Set(ids);
    if (wasSaved) undo.add(id);
    else undo.delete(id);
    setIds(undo);
  }
}

export function useFavoriteIds(): Set<string> {
  return useSyncExternalStore(
    subscribe,
    () => ids,
    () => EMPTY
  );
}

export function useIsFavorite(id: string): boolean {
  return useFavoriteIds().has(id);
}
