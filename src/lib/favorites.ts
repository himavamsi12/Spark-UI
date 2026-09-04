"use client";

import { useSyncExternalStore } from "react";

/**
 * Favourites live in localStorage and are read through useSyncExternalStore,
 * so the sidebar and the detail page stay in step without prop drilling or a
 * provider. The server snapshot is a stable empty array, which keeps the
 * first client render identical to the server's and avoids a hydration
 * mismatch before the stored list is read.
 */
const KEY = "spark-ui:favorites";
const EMPTY: string[] = [];

let cache: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : EMPTY;
  } catch {
    cache = EMPTY;
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Another tab writing the same key should update this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// Reference-stable: only replaced inside toggleFavorite, so React can bail out
// of re-rendering when nothing changed.
function getSnapshot() {
  load();
  return cache;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useFavorites(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function toggleFavorite(slug: string) {
  load();
  cache = cache.includes(slug) ? cache.filter((s) => s !== slug) : [...cache, slug];
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Private mode or a full quota: the list still works for this session.
  }
  emit();
}
