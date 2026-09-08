"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "campus-rental-hub:favorites";
export const FAVORITES_EVENT = "favorites-changed";

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function getFavoriteIds(): Set<string> {
  return readFavorites();
}

export function isFavorite(id: string): boolean {
  return readFavorites().has(id);
}

export function toggleFavorite(id: string) {
  const ids = readFavorites();
  if (ids.has(id)) {
    ids.delete(id);
  } else {
    ids.add(id);
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function useFavoriteIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setIds(readFavorites());
    function handleChange() {
      setIds(readFavorites());
    }
    window.addEventListener(FAVORITES_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return ids;
}
