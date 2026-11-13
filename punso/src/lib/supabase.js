import { createClient } from '@supabase/supabase-js';

// PUNSO Car Rental's Supabase project. Fill in DEFAULT_URL / DEFAULT_ANON_KEY (or set
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at the host) once the project is created — see README.
// Until then the site runs in browser-only demo mode. The anon key is designed to be public;
// security is enforced by the database policies in supabase/schema.sql.
// VITE_DEMO_MODE=true forces demo mode even when keys are set.
const DEFAULT_URL = '';
const DEFAULT_ANON_KEY = '';
const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const hasSupabase = !demoMode && Boolean(url && anonKey);

// By default supabase-js serialises auth work with a browser-wide lock (navigator.locks) that is
// shared by every open tab of the site. One frozen or outdated tab that holds it makes every other
// tab wait forever (saves stuck on "saving…" with nothing sent). Use a lock that only orders work
// inside this tab instead.
let lockTail = Promise.resolve();
function tabLock(_name, _acquireTimeout, fn) {
  const run = lockTail.then(fn, fn);
  lockTail = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export const supabase = hasSupabase
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, lock: tabLock } })
  : null;
