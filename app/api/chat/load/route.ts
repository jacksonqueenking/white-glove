/**
 * Load Chat Messages API Route
 * Loads persisted chat messages from the database
 */

import { createClient } from '@/lib/supabase/server';
import { loadAIChatMessages } from '@/lib/db/ai-chat';

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get chat ID from query params
    const url = new URL(req.url);
    const chatId = url.searchParams.get('id');

    if (!chatId) {
      return new Response('Missing chat ID', { status: 400 });
    }

    console.log('[Load Chat API] Loading messages for chat:', chatId);

    // Load messages from database
    const messages = await loadAIChatMessages(supabase, chatId);

    console.log('[Load Chat API] Loaded', messages.length, 'messages');

    return Response.json({ messages });

  } catch (error) {
    console.error('[Load Chat API] Error:', error);
    return new Response(
      'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
      { status: 500 }
    );
  }
}
