import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Server-side Supabase client preserving auth cookies
export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase public env vars');
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
