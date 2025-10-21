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

      case 'threads.list':
        // Return empty list for now - TODO: implement with ChatKitStore
        return NextResponse.json({
          data: [],
          has_more: false,
          after: null,
        });

      case 'items.feedback':
        // Accept feedback but don't store it for now - TODO: implement
        console.log('[ChatKit] Feedback received:', params);
        return NextResponse.json({});

      case 'threads.get_by_id':
        // TODO: implement thread retrieval
        return NextResponse.json({ error: 'Not implemented' }, { status: 501 });

      case 'items.list':
        // TODO: implement items list
        return NextResponse.json({
          data: [],
          has_more: false,
          after: null,
        });

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

  // Create IDs upfront
  const threadId = `thread_${Date.now()}`;
  const messageId = `msg_${Date.now()}`;
  const now = new Date().toISOString();

  // Run the agent
  const result = await run(agent, userMessage);
  const fullText = result.finalOutput || 'No response generated.';

  console.log('[ChatKit] Got response:', fullText);

  // Create a ReadableStream that yields SSE events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Event 1: Thread created
        const threadCreatedEvent = {
          type: 'thread.created',
          thread: {
            id: threadId,
            created_at: now,
            status: { type: 'active' },
            items: { data: [], has_more: false, after: null },
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(threadCreatedEvent)}\n\n`));
        console.log('[ChatKit] Sent thread.created');

        // Event 2: User message added
        const userMessageId = `msg_user_${Date.now()}`;
        const userMessageEvent = {
          type: 'thread.item.added',
          item: {
            id: userMessageId,
            thread_id: threadId,
            type: 'user_message',
            content: [{ type: 'input_text', text: userMessage }],
            created_at: now,
            attachments: [],
            inference_options: {},
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(userMessageEvent)}\n\n`));
        console.log('[ChatKit] Sent user message');

        // Event 3: User message done
        const userMessageDoneEvent = {
          type: 'thread.item.done',
          item: {
            id: userMessageId,
            thread_id: threadId,
            type: 'user_message',
            content: [{ type: 'input_text', text: userMessage }],
            created_at: now,
            attachments: [],
            inference_options: {},
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(userMessageDoneEvent)}\n\n`));
        console.log('[ChatKit] Sent user message done');

        // Event 4: Assistant message added
        const assistantMessageEvent = {
          type: 'thread.item.added',
          item: {
            id: messageId,
            thread_id: threadId,
            type: 'assistant_message',
            content: [{ type: 'output_text', text: '', annotations: [] }],
            created_at: now,
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(assistantMessageEvent)}\n\n`));
        console.log('[ChatKit] Sent assistant message added');

        // Event 5: Assistant message done
        const assistantDoneEvent = {
          type: 'thread.item.done',
          item: {
            id: messageId,
            thread_id: threadId,
            type: 'assistant_message',
            content: [{ type: 'output_text', text: fullText, annotations: [] }],
            created_at: now,
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(assistantDoneEvent)}\n\n`));
        console.log('[ChatKit] Sent assistant message done');

        controller.close();
        console.log('[ChatKit] Stream closed');
      } catch (error) {
        console.error('[ChatKit] Stream error:', error);
        controller.error(error);
      }
    },
  });

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
  const fullText = result.finalOutput || 'No response generated.';

  console.log('[ChatKit] Got response:', fullText);

  // Create IDs
  const messageId = `msg_${Date.now()}`;
  const now = new Date().toISOString();

  // Create a ReadableStream that yields SSE events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Event 1: User message added
        const userMessageId = `msg_user_${Date.now()}`;
        const userMessageEvent = {
          type: 'thread.item.added',
          item: {
            id: userMessageId,
            thread_id: threadId,
            type: 'user_message',
            content: [{ type: 'input_text', text: userMessage }],
            created_at: now,
            attachments: [],
            inference_options: {},
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(userMessageEvent)}\n\n`));
        console.log('[ChatKit] Sent user message');

        // Event 2: User message done
        const userMessageDoneEvent = {
          type: 'thread.item.done',
          item: {
            id: userMessageId,
            thread_id: threadId,
            type: 'user_message',
            content: [{ type: 'input_text', text: userMessage }],
            created_at: now,
            attachments: [],
            inference_options: {},
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(userMessageDoneEvent)}\n\n`));
        console.log('[ChatKit] Sent user message done');

        // Event 3: Assistant message added
        const assistantMessageEvent = {
          type: 'thread.item.added',
          item: {
            id: messageId,
            thread_id: threadId,
            type: 'assistant_message',
            content: [{ type: 'output_text', text: '', annotations: [] }],
            created_at: now,
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(assistantMessageEvent)}\n\n`));
        console.log('[ChatKit] Sent assistant message added');

        // Event 4: Assistant message done
        const assistantDoneEvent = {
          type: 'thread.item.done',
          item: {
            id: messageId,
            thread_id: threadId,
            type: 'assistant_message',
            content: [{ type: 'output_text', text: fullText, annotations: [] }],
            created_at: now,
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(assistantDoneEvent)}\n\n`));
        console.log('[ChatKit] Sent assistant message done');

        controller.close();
        console.log('[ChatKit] Stream closed');
      } catch (error) {
        console.error('[ChatKit] Stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
