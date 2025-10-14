/**
 * ChatKit Session API Route
 *
 * Creates and manages ChatKit sessions for AI chat interfaces.
 * This endpoint generates short-lived client tokens that ChatKit uses
 * to authenticate with OpenAI's services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

/**
 * POST /api/chatkit/session
 *
 * Creates a new ChatKit session or refreshes an existing one.
 * Requires authentication via Supabase session.
 *
 * Query Parameters:
 * - agentType: 'client' | 'venue_general' | 'venue_event'
 * - eventId: string (required for client and venue_event agents)
 * - venueId: string (required for venue agents)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication from Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType') as 'client' | 'venue_general' | 'venue_event';
    const eventId = searchParams.get('eventId');
    const venueId = searchParams.get('venueId');

    // Validate parameters
    if (!agentType) {
      return NextResponse.json(
        { error: 'Missing agentType parameter' },
        { status: 400 }
      );
    }

    if ((agentType === 'client' || agentType === 'venue_event') && !eventId) {
      return NextResponse.json(
        { error: 'Missing eventId parameter' },
        { status: 400 }
      );
    }

    if ((agentType === 'venue_general' || agentType === 'venue_event') && !venueId) {
      return NextResponse.json(
        { error: 'Missing venueId parameter' },
        { status: 400 }
      );
    }

    // Get or create session ID from cookies
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('chatkit_session_id')?.value;

    if (!sessionId) {
      sessionId = `session_${user.id}_${Date.now()}`;
      cookieStore.set('chatkit_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Build agent configuration based on type
    const agentConfig = buildAgentConfig(agentType, {
      userId: user.id,
      eventId: eventId || undefined,
      venueId: venueId || undefined,
    });

    // Create ChatKit session with OpenAI
    // Note: This is a placeholder - actual implementation depends on OpenAI's ChatKit API
    // which may use Agent Builder workflows or direct agent configuration
    const session = await createChatKitSession({
      sessionId,
      userId: user.id,
      agentConfig,
    });

    return NextResponse.json({
      client_secret: session.client_secret,
      session_id: sessionId,
    });

  } catch (error) {
    console.error('ChatKit session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * Build agent configuration based on agent type
 */
function buildAgentConfig(
  agentType: string,
  context: { userId: string; eventId?: string; venueId?: string }
) {
  // This will be implemented based on your agent configurations
  // For now, return basic config
  return {
    type: agentType,
    userId: context.userId,
    eventId: context.eventId,
    venueId: context.venueId,
  };
}

/**
 * Create ChatKit session
 *
 * Creates a session using OpenAI's ChatKit API.
 * Note: This will use the Sessions API once Agent Builder workflows are configured.
 * For now, it returns a development token.
 */
async function createChatKitSession(params: {
  sessionId: string;
  userId: string;
  agentConfig: any;
}) {
  try {
    // Check if we have a workflow ID for this agent type
    const workflowId = getWorkflowIdForAgentType(params.agentConfig.type);

    if (workflowId) {
      // TODO: Once ChatKit SDK is fully released, use this:
      // const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     workflow_id: workflowId,
      //     metadata: {
      //       user_id: params.userId,
      //       session_id: params.sessionId,
      //       agent_type: params.agentConfig.type,
      //       event_id: params.agentConfig.eventId,
      //       venue_id: params.agentConfig.venueId,
      //     },
      //   }),
      // });
      // const data = await response.json();
      // return {
      //   client_secret: data.client_secret,
      //   session_id: params.sessionId,
      // };

      console.log('Workflow ID configured but ChatKit SDK not yet available:', workflowId);
    }

    // Development mode: return a session token
    // In production, you'll configure Agent Builder workflows and use the API above
    return {
      client_secret: `cs_dev_${params.sessionId}_${Date.now()}`,
      session_id: params.sessionId,
      dev_mode: true,
    };
  } catch (error) {
    console.error('Failed to create ChatKit session:', error);

    // Fallback: create a basic session token
    return {
      client_secret: `cs_dev_${params.sessionId}_${Date.now()}`,
      session_id: params.sessionId,
      error: String(error),
    };
  }
}

/**
 * Get Agent Builder workflow ID for agent type
 */
function getWorkflowIdForAgentType(agentType: string): string | null {
  const workflowIds = {
    client: process.env.OPENAI_WORKFLOW_ID_CLIENT,
    venue_general: process.env.OPENAI_WORKFLOW_ID_VENUE_GENERAL,
    venue_event: process.env.OPENAI_WORKFLOW_ID_VENUE_EVENT,
  };

  return workflowIds[agentType as keyof typeof workflowIds] || null;
}
