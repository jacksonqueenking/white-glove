/**
 * Vercel AI SDK Chat API Route
 * Based on: https://ai-sdk.dev/elements/examples/chatbot
 */

import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
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
import { getToolsForAgent, type ToolContext } from '@/lib/agents/tools.ai';

export const maxDuration = 30;

// Cache system prompts to avoid rebuilding on every message
const systemPromptCache = new Map<string, { prompt: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  console.log('[Chat API] ========== NEW REQUEST ==========');

  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Chat API] Auth error:', authError);
      return new Response('Unauthorized', { status: 401 });
    }

    const userType = user.user_metadata?.user_type as 'client' | 'venue' | 'vendor';
    if (!userType) {
      console.error('[Chat API] Invalid user type');
      return new Response('Invalid user type', { status: 403 });
    }

    // Parse request
    const {
      messages,
      agentType,
      eventId,
      venueId,
      systemPrompt: prebuiltSystemPrompt,
    }: {
      messages: UIMessage[];
      agentType: 'client' | 'venue_general' | 'venue_event';
      eventId?: string;
      venueId?: string;
      systemPrompt?: string;
    } = await req.json();

    console.log('[Chat API] Request:', {
      userId: user.id,
      userType,
      agentType,
      eventId,
      venueId,
      messageCount: messages.length,
      hasPrebuiltPrompt: !!prebuiltSystemPrompt,
    });

    let systemPrompt: string;

    // Use pre-built system prompt if provided (fastest path)
    if (prebuiltSystemPrompt) {
      console.log('[Chat API] Using pre-built system prompt from client');
      systemPrompt = prebuiltSystemPrompt;
    } else {
      // Fall back to cache or building new prompt
      const cacheKey = `${agentType}-${eventId || venueId || user.id}`;
      const now = Date.now();
      const cached = systemPromptCache.get(cacheKey);

      // Use cached prompt if it exists and is still fresh
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        console.log('[Chat API] Using cached system prompt');
        systemPrompt = cached.prompt;
      } else {
        console.log('[Chat API] Building new system prompt');

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
          console.error('[Chat API] Missing required IDs');
          return new Response('Missing required parameters', { status: 400 });
        }

        // Cache the newly built prompt
        systemPromptCache.set(cacheKey, { prompt: systemPrompt, timestamp: now });
        console.log('[Chat API] System prompt cached');
      }
    }

    console.log('[Chat API] System prompt length:', systemPrompt.length);

    // Create tool context
    const toolContext: ToolContext = {
      userId: user.id,
      userType,
    };

    // Get tools for the agent type
    const tools = getToolsForAgent(agentType, supabase, toolContext);

    // Stream response
    const result = streamText({
      model: openai('gpt-5'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      tools,
    });

    console.log('[Chat API] Returning stream response with', Object.keys(tools).length, 'tools');

    // Return UIMessage stream (for AI Elements compatibility)
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
      { status: 500 }
    );
  }
}
