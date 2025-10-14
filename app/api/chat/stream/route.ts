/**
 * Agent Chat Streaming API Route
 *
 * Handles streaming chat messages using OpenAI's Agents SDK.
 * Returns Server-Sent Events for real-time streaming responses.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createClientAgent,
  createVenueGeneralAgent,
  createVenueEventAgent,
} from '@/lib/agents/agentSDK';

export const runtime = 'nodejs';

/**
 * POST /api/chat/stream
 *
 * Stream chat responses using Server-Sent Events.
 */
export async function POST(request: NextRequest) {
  // Get authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Parse request body
  const body = await request.json();
  const { message, agentType, eventId, venueId } = body;

  if (!message || !agentType) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Create encoder for streaming
  const encoder = new TextEncoder();

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create the appropriate agent
        let agent;

        switch (agentType) {
          case 'client':
            ({ agent } = await createClientAgent(user.id, eventId));
            break;
          case 'venue_general':
            ({ agent } = await createVenueGeneralAgent(venueId));
            break;
          case 'venue_event':
            ({ agent } = await createVenueEventAgent(venueId, eventId));
            break;
          default:
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Invalid agent type' })}\n\n`));
            controller.close();
            return;
        }

        // Send initial message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));

        // Import run function
        const { run } = await import('@openai/agents');

        // Note: Agents SDK streaming may work differently
        // For now, we'll run non-streaming and return the full response
        // You can update this when streaming is properly supported

        const result = await run(agent, message);

        // Send the complete response
        // In a real streaming implementation, you would emit chunks as they arrive
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'done',
          response: result.finalOutput,
        })}\n\n`));

        controller.close();

      } catch (error) {
        console.error('Streaming error:', error);
        const errorData = JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  // Return streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
