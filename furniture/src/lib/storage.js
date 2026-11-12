import { useEffect, useState } from 'react';

// Per-device conveniences (cart, phone numbers used for orders). Never throws.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode / storage full */
    }
  }, [key, value]);
  return [value, setValue];
}
