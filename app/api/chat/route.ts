/**
 * Vercel AI SDK Chat API Route
 *
 * Handles streaming chat completions with context-aware AI agents.
 * Replaces the OpenAI ChatKit implementation with Vercel AI SDK.
 */

import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import type { UIMessage } from 'ai';
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

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatRequest {
  messages: UIMessage[];
  chatId?: string;
  agentType: 'client' | 'venue_general' | 'venue_event';
  eventId?: string;
  venueId?: string;
}

export async function POST(request: NextRequest) {
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
      console.error('[Chat API] Invalid user type:', user.user_metadata);
      return new Response('Invalid user type', { status: 403 });
    }

    // Parse request body
    const body = await request.json() as ChatRequest;
    const { messages, chatId, agentType, eventId, venueId } = body;

    console.log('[Chat API] Request:', {
      userId: user.id,
      userType,
      agentType,
      eventId,
      venueId,
      chatId,
      messageCount: messages.length,
    });

    // Build context and generate system prompt based on agent type
    let systemPrompt: string;

    try {
      if (agentType === 'client' && eventId) {
        console.log('[Chat API] Building client context for event:', eventId);
        const context = await buildClientContext(supabase, user.id, eventId);
        systemPrompt = generateClientSystemPrompt(context as any);
      } else if (agentType === 'venue_general' && venueId) {
        console.log('[Chat API] Building venue general context for venue:', venueId);
        const context = await buildVenueGeneralContext(supabase, venueId);
        systemPrompt = generateVenueGeneralSystemPrompt(context as any);
      } else if (agentType === 'venue_event' && venueId && eventId) {
        console.log('[Chat API] Building venue event context for event:', eventId);
        const context = await buildVenueEventContext(supabase, venueId, eventId);
        systemPrompt = generateVenueEventSystemPrompt(context as any);
      } else {
        console.error('[Chat API] Missing required IDs for agent type:', agentType, { eventId, venueId });
        return new Response('Missing required parameters (eventId or venueId)', { status: 400 });
      }
    } catch (error) {
      console.error('[Chat API] Failed to build context:', error);
      return new Response('Failed to build agent context: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
    }

    console.log('[Chat API] System prompt generated, length:', systemPrompt.length);

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);
    console.log('[Chat API] Converted messages:', modelMessages.length);

    // Stream text response using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: modelMessages,
      // Tools will be added in the next phase
      maxSteps: 5, // Allow multiple tool calls when we add tools
    });

    console.log('[Chat API] Streaming response...');

    // Return streaming response
    // We'll add message persistence in the next phase
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
      { status: 500 }
    );
  }
}
