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
    } catch {
      /* storage unavailable or full — keep in memory */
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
