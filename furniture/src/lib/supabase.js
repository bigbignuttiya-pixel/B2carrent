import { createClient } from '@supabase/supabase-js';

// The design site shares B2 Rental's Supabase project (its data lives in separate
// furniture_* tables and buckets). The anon key is designed to be public; security is enforced
// by the database policies in supabase/schema.sql. Environment variables override these values.
const DEFAULT_URL = 'https://fxnvwjugcapmyybvgymv.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bnZ3anVnY2FwbXl5YnZneW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNjQyNjEsImV4cCI6MjEwOTk0MDI2MX0.dRv__PLhVX3KmKntfj6bTIH1c0LaOhR4zRfNTaFHrRM';

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

// Same reason as B2 Rental: avoid the browser-wide auth lock that one frozen tab can hold forever
let lockTail = Promise.resolve();
function tabLock(_name, _acquireTimeout, fn) {
  const run = lockTail.then(fn, fn);
  lockTail = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, lock: tabLock, storageKey: 'furniture-auth' },
});
