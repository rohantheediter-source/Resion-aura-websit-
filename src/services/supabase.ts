import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (process.env as any || {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ybnkfhiqtsnzaauzuxve.supabase.co';
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Jgzo4SOtbVWPA6eVXoTSng_f9O5QE6P';


if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Publishable Key missing in environment.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Checks if the remote database is accessible and tables exist.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error && error.code === 'PGRST205') {
      // Table does not exist in schema cache yet
      return false;
    }
    return !error;
  } catch (err) {
    console.error('Supabase connection check error:', err);
    return false;
  }
}

