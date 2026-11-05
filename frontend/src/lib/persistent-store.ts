"use client";
import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed external store. One factory powers reviews, brand kit,
 * settings and theme, so swapping to an API later means replacing this one file.
 * SSR-safe: servers always see `serverValue`; the client hydrates, then re-renders.
 */
export function createPersistentStore<T>(key: string, getInitial: () => T, serverValue: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());
  const persist = (value: T) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ } };

  function read(): T {
    if (typeof window === "undefined") return serverValue;
    if (cache !== undefined) return cache;
    try {
      const raw = localStorage.getItem(key);
      if (raw) cache = JSON.parse(raw) as T;
    } catch { cache = undefined; }
    if (cache === undefined) { cache = getInitial(); persist(cache); }
    return cache;
  }
  function write(value: T) { cache = value; persist(value); emit(); }
  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => { if (e.key === key) { cache = undefined; emit(); } };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
  }

  return {
    read,
    write,
    update: (fn: (current: T) => T) => write(fn(read())),
    reset: () => write(getInitial()),
    use: () => useSyncExternalStore(subscribe, read, () => serverValue)
  };
}
