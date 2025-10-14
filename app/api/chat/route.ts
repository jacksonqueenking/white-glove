/**
 * Agent Chat API Route
 *
 * Handles chat messages using OpenAI's Agents SDK.
 * This endpoint receives messages, runs them through the appropriate agent,
 * and returns AI-generated responses with tool execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createClientAgent,
  createVenueGeneralAgent,
  createVenueEventAgent,
  runAgent,
} from '@/lib/agents/agentSDK';

export const runtime = 'nodejs'; // Agents SDK requires Node.js runtime

/**
 * POST /api/chat
 *
 * Process a chat message through an AI agent.
 *
 * Request body:
 * {
 *   message: string,
 *   agentType: 'client' | 'venue_general' | 'venue_event',
 *   eventId?: string,
 *   venueId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, agentType, eventId, venueId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      );
    }

    if (!agentType) {
      return NextResponse.json(
        { error: 'Missing agentType' },
        { status: 400 }
      );
    }

    // Validate required parameters
    if ((agentType === 'client' || agentType === 'venue_event') && !eventId) {
      return NextResponse.json(
        { error: 'eventId required for this agent type' },
        { status: 400 }
      );
    }

    if ((agentType === 'venue_general' || agentType === 'venue_event') && !venueId) {
      return NextResponse.json(
        { error: 'venueId required for this agent type' },
        { status: 400 }
      );
    }

    // Create the appropriate agent
    let agent;
    let context;

    try {
      switch (agentType) {
        case 'client':
          ({ agent, context } = await createClientAgent(user.id, eventId));
          break;
        case 'venue_general':
          ({ agent, context } = await createVenueGeneralAgent(venueId));
          break;
        case 'venue_event':
          ({ agent, context } = await createVenueEventAgent(venueId, eventId));
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid agent type' },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      return NextResponse.json(
        {
          error: 'Failed to create agent',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Run the agent with the message
    try {
      const result = await runAgent(agent, message);

      return NextResponse.json({
        response: result.response,
        agentType,
        contextSummary: {
          eventId,
          venueId,
        },
      });
    } catch (error) {
      console.error('Failed to run agent:', error);
      return NextResponse.json(
        {
          error: 'Failed to process message',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Agent chat API is running',
    availableAgents: ['client', 'venue_general', 'venue_event'],
  });
}
