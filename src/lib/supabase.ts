import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

// In-memory session storage — tokens never written to localStorage.
// Trade-off: users must log in again after a page refresh.
const memoryStore: Record<string, string> = {};
const inMemoryStorage = {
  getItem: (key: string) => memoryStore[key] ?? null,
  setItem: (key: string, value: string) => { memoryStore[key] = value; },
  removeItem: (key: string) => { delete memoryStore[key]; },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: inMemoryStorage,
    persistSession: true,  // persist within the memory store (not localStorage)
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
