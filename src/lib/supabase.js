import { createClient } from '@supabase/supabase-js';

// Set these in .env.local (dev) or in your hosting provider's environment variables.
// The anon key is designed to be public: security is enforced by the database policies in supabase/schema.sql.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);
export const supabase = hasSupabase
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
