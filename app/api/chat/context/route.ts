/**
 * API endpoint to pre-build system prompts
 * Called on page load to prepare context before first message
 */

import { createClient } from '@/lib/supabase/server';
import {
  buildClientContext,
  buildVenueGeneralContext,
  buildVenueEventContext,
} from '@/lib/agents/context';
import {
  generateClientSystemPrompt,
  generateVenueGeneralSystemPrompt,
  generateVenueEventSystemPrompt,
} from '@/lib/agents/prompts';

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request
    const {
      agentType,
      eventId,
      venueId,
    }: {
      agentType: 'client' | 'venue_general' | 'venue_event';
      eventId?: string;
      venueId?: string;
    } = await req.json();

    console.log('[Context API] Building system prompt for:', { agentType, eventId, venueId });

    // Build context and system prompt
    let systemPrompt: string;

    if (agentType === 'client' && eventId) {
      const context = await buildClientContext(supabase, user.id, eventId);
      systemPrompt = generateClientSystemPrompt(context as any);
    } else if (agentType === 'venue_general' && venueId) {
      const context = await buildVenueGeneralContext(supabase, venueId);
      systemPrompt = generateVenueGeneralSystemPrompt(context as any);
    } else if (agentType === 'venue_event' && venueId && eventId) {
      const context = await buildVenueEventContext(supabase, venueId, eventId);
      systemPrompt = generateVenueEventSystemPrompt(context as any);
    } else {
      return new Response('Missing required parameters', { status: 400 });
    }

    console.log('[Context API] System prompt built, length:', systemPrompt.length);

    return Response.json({ systemPrompt });

  } catch (error) {
    console.error('[Context API] Error:', error);
    return new Response(
      'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
      { status: 500 }
    );
  }
}
