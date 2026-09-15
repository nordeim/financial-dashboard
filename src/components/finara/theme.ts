"use client";

/**
 * Theme store — mirrors the source app's Dark Mode toggle semantics:
 * flipping the control swaps `document.documentElement` between the "light"
 * and "dark" classes and persists the choice so a reload keeps the theme.
 * Uses the M-3 useSyncExternalStore idiom (no effect-body setState).
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "finara-theme";

let cachedTheme: Theme | null = null;
let cacheLoaded = false;
const listeners = new Set<() => void>();

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function loadTheme(): Theme | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(raw) ? raw : null;
  } catch {
    // Storage unavailable (sandboxed iframe / privacy mode) — stay in memory.
    return null;
  }
}

function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Persisting is best-effort only.
  }
}

function applyThemeClass(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

function readThemeCache(): Theme | null {
  if (!cacheLoaded) {
    cacheLoaded = true;
    cachedTheme = loadTheme();
    if (cachedTheme) applyThemeClass(cachedTheme);
  }
  return cachedTheme;
}

function writeTheme(theme: Theme): void {
  cachedTheme = theme;
  cacheLoaded = true;
  persistTheme(theme);
  applyThemeClass(theme);
  for (const listener of listeners) listener();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getServerTheme(): Theme | null {
  // Server snapshot: null renders the light shell; the client store resolves
  // the persisted theme immediately after hydration.
  return null;
}

export function setTheme(theme: Theme): void {
  writeTheme(theme);
}

/** Stable client snapshot for useSyncExternalStore (M-3 idiom). */
export function getThemeSnapshot(): Theme | null {
  return readThemeCache();
}

export function toggleTheme(): void {
  writeTheme(readThemeCache() === "dark" ? "light" : "dark");
}
