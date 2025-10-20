/**
 * ChatKit Custom Backend API
 *
 * Implements the OpenAI ChatKit server protocol (based on openai/chatkit-python).
 *
 * Protocol Documentation:
 * - Source: https://github.com/openai/chatkit-python
 * - Streaming requests return SSE (Server-Sent Events)
 * - Non-streaming requests return JSON
 *
 * Request Types:
 * - threads.create: Create new thread with first message (streaming)
 * - threads.add_user_message: Add message to existing thread (streaming)
 * - threads.get: Get thread by ID (non-streaming)
 * - threads.list: List threads (non-streaming)
 * - And more...
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Agent, run } from '@openai/agents';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Main ChatKit endpoint - ChatKit Protocol Handler
 *
 * Handles all ChatKit protocol requests. All requests come as JSON with a
 * 'type' field that determines the operation.
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[ChatKit] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type as 'client' | 'venue' | 'vendor';
    if (!userType) {
      console.error('[ChatKit] Invalid user type:', user.user_metadata);
      return NextResponse.json({ error: 'Invalid user type' }, { status: 403 });
    }

    // Parse request body - ChatKit protocol format
    const body = await request.json();
    console.log('[ChatKit] Request body:', JSON.stringify(body, null, 2));

    const { type, params, metadata } = body;

    console.log('[ChatKit] Request type:', type);
    console.log('[ChatKit] Metadata:', metadata);

    // Route based on ChatKit request type
    switch (type) {
      case 'threads.create':
        return handleThreadCreate(user.id, userType, params, metadata);

      case 'threads.add_user_message':
        return handleMessageCreate(user.id, userType, params, metadata);

      default:
        console.error('[ChatKit] Unknown request type:', type);
        return NextResponse.json({ error: `Unknown request type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[ChatKit] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle thread creation
 */
async function handleThreadCreate(
  userId: string,
  userType: 'client' | 'venue' | 'vendor',
  params: any,
  metadata?: any
) {
  console.log('[ChatKit] Creating thread for user:', userId);
  console.log('[ChatKit] Thread params:', params);

  // Extract the user's message from input
  const input = params?.input;
  const content = input?.content?.[0];
  const userMessage = content?.text || '';

  console.log('[ChatKit] User message:', userMessage);

  // Get agent configuration from metadata
  const agentType = metadata?.agentType || userType;

  // Create appropriate instructions based on agent type
  let instructions = 'You are a helpful AI assistant for White Glove, an event planning platform.';

  if (agentType === 'client') {
    instructions = 'You are a helpful assistant for event planning clients. Help them plan their events, answer questions, and guide them through the process.';
  } else if (agentType === 'venue_general') {
    instructions = 'You are a helpful assistant for venue managers. Help them manage their venue, handle events, and coordinate with clients and vendors.';
  } else if (agentType === 'venue_event') {
    instructions = 'You are a helpful assistant for managing a specific event. Help coordinate all aspects of the event, from planning to execution.';
  }

  console.log('[ChatKit] Creating agent with type:', agentType);

  // Create agent
  const agent = new Agent({
    name: 'White Glove Assistant',
    model: 'gpt-4o',
    instructions,
  });

  console.log('[ChatKit] Running agent...');

  // Run the agent
  const result = await run(agent, userMessage);

  console.log('[ChatKit] Agent result:', result);

  // Get the assistant's response
  const assistantResponse = result.finalOutput || 'I apologize, but I was unable to generate a response.';

  console.log('[ChatKit] Assistant response:', assistantResponse);

  // Return SSE stream with ChatKit events
  const threadId = `thread_${Date.now()}`;
  const messageId = `msg_${Date.now()}`;
  const now = new Date().toISOString();

  // Create SSE response with multiple events
  const events = [
    // Event 1: Thread created
    {
      type: 'thread.created',
      thread: {
        id: threadId,
        created_at: now,
        metadata: metadata || {},
      },
    },
    // Event 2: Item added (assistant message)
    {
      type: 'thread.item.added',
      item: {
        id: messageId,
        thread_id: threadId,
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: assistantResponse,
          },
        ],
        created_at: now,
      },
    },
    // Event 3: Item done
    {
      type: 'thread.item.done',
      item: {
        id: messageId,
        thread_id: threadId,
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: assistantResponse,
          },
        ],
        created_at: now,
      },
    },
  ];

  // Format as SSE stream
  const stream = events
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join('');

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Handle message creation in existing thread
 */
async function handleMessageCreate(
  userId: string,
  userType: 'client' | 'venue' | 'vendor',
  params: any,
  metadata?: any
) {
  console.log('[ChatKit] Creating message for user:', userId);
  console.log('[ChatKit] Message params:', params);

  // Extract the user's message from input
  const input = params?.input;
  const content = input?.content?.[0];
  const userMessage = content?.text || '';
  const threadId = params?.thread_id;

  console.log('[ChatKit] User message:', userMessage);
  console.log('[ChatKit] Thread ID:', threadId);

  // Get agent configuration from metadata
  const agentType = metadata?.agentType || userType;

  // Create appropriate instructions based on agent type
  let instructions = 'You are a helpful AI assistant for White Glove, an event planning platform.';

  if (agentType === 'client') {
    instructions = 'You are a helpful assistant for event planning clients. Help them plan their events, answer questions, and guide them through the process.';
  } else if (agentType === 'venue_general') {
    instructions = 'You are a helpful assistant for venue managers. Help them manage their venue, handle events, and coordinate with clients and vendors.';
  } else if (agentType === 'venue_event') {
    instructions = 'You are a helpful assistant for managing a specific event. Help coordinate all aspects of the event, from planning to execution.';
  }

  // Create agent
  const agent = new Agent({
    name: 'White Glove Assistant',
    model: 'gpt-4o',
    instructions,
  });

  // Run the agent
  const result = await run(agent, userMessage);

  // Get the assistant's response
  const assistantResponse = result.finalOutput || 'I apologize, but I was unable to generate a response.';

  console.log('[ChatKit] Assistant response:', assistantResponse);

  // Return SSE stream with ChatKit events
  const messageId = `msg_${Date.now()}`;
  const now = new Date().toISOString();

  // Create SSE response with multiple events
  const events = [
    // Event 1: Item added (assistant message)
    {
      type: 'thread.item.added',
      item: {
        id: messageId,
        thread_id: threadId,
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: assistantResponse,
          },
        ],
        created_at: now,
      },
    },
    // Event 2: Item done
    {
      type: 'thread.item.done',
      item: {
        id: messageId,
        thread_id: threadId,
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: assistantResponse,
          },
        ],
        created_at: now,
      },
    },
  ];

  // Format as SSE stream
  const stream = events
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join('');

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
