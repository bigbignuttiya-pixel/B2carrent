import { createClient } from '@supabase/supabase-js';

// B2 Rental's Supabase project. The anon key is designed to be public (it ships in every
// browser that opens the site); security is enforced by the database policies in
// supabase/schema.sql. Environment variables override these values, and
// VITE_DEMO_MODE=true runs the site in browser-only demo mode instead.
const DEFAULT_URL = 'https://fxnvwjugcapmyybvgymv.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bnZ3anVnY2FwbXl5YnZneW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNjQyNjEsImV4cCI6MjEwOTk0MDI2MX0.dRv__PLhVX3KmKntfj6bTIH1c0LaOhR4zRfNTaFHrRM';

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
