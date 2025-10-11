/**
 * Supabase Client Configuration
 *
 * This module provides configured Supabase clients for both client-side
 * and server-side operations.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Client-side Supabase client (uses anon key, respects RLS)
 *
 * This client should be used in browser contexts and API routes
 * where you want Row-Level Security policies to be enforced.
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/db/supabaseClient';
 *
 * const { data, error } = await supabase
 *   .from('events')
 *   .select('*')
 *   .eq('client_id', userId);
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Server-side Supabase client (uses service role key, bypasses RLS)
 *
 * This client should ONLY be used in server-side contexts (API routes, server actions)
 * where you need to bypass Row-Level Security for administrative operations.
 *
 * ⚠️ WARNING: This client has full database access. Use with caution.
 * Always validate permissions in your application logic.
 *
 * @example
 * ```typescript
 * import { supabaseAdmin } from '@/lib/db/supabaseClient';
 *
 * // Create a notification for a user (bypassing RLS)
 * const { error } = await supabaseAdmin
 *   .from('notifications')
 *   .insert({
 *     user_id: userId,
 *     user_type: 'client',
 *     notification_type: 'task_created',
 *     title: 'New Task',
 *     content: 'You have a new task',
 *   });
 * ```
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Get Supabase client instance (alias for client-side client)
 *
 * @deprecated Use `supabase` directly instead
 */
export function getSupabaseClient() {
  return supabase;
}

/**
 * Type helper for Supabase clients
 */
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;
