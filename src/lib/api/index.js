import { hasSupabase } from '../supabase';
import { localApi } from './local';
import { remoteApi } from './remote';

// Cloud mode when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, otherwise browser-only demo mode
export const api = hasSupabase ? remoteApi : localApi;
export const isCloud = hasSupabase;
export { errorMessage } from './errors';
