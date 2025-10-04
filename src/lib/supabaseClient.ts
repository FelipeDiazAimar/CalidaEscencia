import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Obtain a browser Supabase client. Use ONLY public anon key here.
 */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Supabase config check:');
  console.log('URL:', url);
  console.log('Key exists:', !!key);
  
  // Return null if not configured properly instead of throwing
  if (!url || !key || 
      url.includes('your-project-id') || 
      url.includes('your_supabase_url_here') ||
      key.includes('your-anon-key') ||
      key.includes('your_supabase_anon_key_here')) {
    console.log('❌ Supabase not configured properly, returning null');
    return null;
  }
  
  console.log('✅ Supabase configuration looks valid');
  return createClient<Database>(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
}

export const supabase = getSupabaseBrowser();
