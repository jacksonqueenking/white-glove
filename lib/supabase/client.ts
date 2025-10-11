// Supabase client for client-side operations
import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types.gen';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
