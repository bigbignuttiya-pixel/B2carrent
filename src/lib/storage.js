import { useEffect, useState } from 'react';

// Persist state in localStorage (demo backend). Falls back to memory if storage is blocked.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Storage blocked or quota exceeded (e.g. too many photos) — keep in memory and tell the UI
      window.dispatchEvent(new CustomEvent('b2:storage-error', { detail: { key, name: err?.name } }));
    }
  }, [key, value]);
  return [value, setValue];
}

export function resetPersistentData(prefix = 'b2:') {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
