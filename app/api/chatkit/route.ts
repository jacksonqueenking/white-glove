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
import { Agent, Runner } from '@openai/agents';
import { createChatKitStore } from '@/lib/chatkit/store';
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
import { getToolsForAgent, type ToolContext } from '@/lib/agents/tools';

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
        return handleThreadsList(user.id, params);

      case 'items.feedback':
        return handleFeedback(user.id, params);

      case 'threads.get_by_id':
        return handleThreadGetById(user.id, params);

      case 'items.list':
        return handleItemsList(user.id, params);

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
  const eventId = metadata?.eventId;
  const venueId = metadata?.venueId;

  console.log('[ChatKit] Creating agent with type:', agentType);

  // Build context and generate instructions based on agent type
  const supabase = await createClient();
  let instructions: string;

  try {
    if (agentType === 'client' && eventId) {
      console.log('[ChatKit] Building client context for event:', eventId);
      const context = await buildClientContext(supabase, userId, eventId);
      instructions = generateClientSystemPrompt(context as any);
    } else if (agentType === 'venue_general' && venueId) {
      console.log('[ChatKit] Building venue general context for venue:', venueId);
      const context = await buildVenueGeneralContext(supabase, venueId);
      instructions = generateVenueGeneralSystemPrompt(context as any);
    } else if (agentType === 'venue_event' && venueId && eventId) {
      console.log('[ChatKit] Building venue event context for event:', eventId);
      const context = await buildVenueEventContext(supabase, venueId, eventId);
      instructions = generateVenueEventSystemPrompt(context as any);
    } else {
      // Fallback for missing context
      console.warn('[ChatKit] Missing required IDs for agent type:', agentType, { eventId, venueId });
      instructions = 'You are a helpful AI assistant for White Glove, an event planning platform. Help users with their questions about events, venues, and planning.';
    }
  } catch (error) {
    console.error('[ChatKit] Failed to build context:', error);
    instructions = 'You are a helpful AI assistant for White Glove, an event planning platform. Help users with their questions about events, venues, and planning.';
  }

  // Initialize ChatKit store
  const store = await createChatKitStore();

  // Create thread in database
  let thread;
  try {
    thread = await store.createThread({
      user_id: userId,
      user_type: userType,
      agent_type: agentType,
      event_id: eventId,
      venue_id: venueId,
      title: userMessage.substring(0, 100) || 'New conversation',
    });
  } catch (error) {
    console.error('[ChatKit] Failed to create thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }

  const threadId = thread.thread_id;
  console.log('[ChatKit] Created thread:', threadId);

  // Get tools for this agent type
  const tools = getToolsForAgent(agentType);

  // Create agent
  const agent = new Agent({
    name: 'White Glove Assistant',
    model: 'gpt-5',
    instructions,
    tools,
  });

  console.log('[ChatKit] Running agent...');
  console.log('[ChatKit] Available tools:', tools.length);

  // Create tool context
  const toolContext: ToolContext = { userId, userType };

  // Create a runner with event logging
  const runner = new Runner();

  // Attach event listeners for tool execution logging
  runner.on('agent_tool_start', (context, agent, tool, details) => {
    console.log('[ChatKit] Tool called:', {
      name: tool.name,
      args: details.toolCall.input,
    });
  });

  runner.on('agent_tool_end', (context, agent, tool, result, details) => {
    console.log('[ChatKit] Tool completed:', {
      name: tool.name,
      resultLength: result ? result.length : 0,
    });
  });

  // Run the agent with context
  const result = await runner.run(agent, userMessage, { context: toolContext });
  const fullText = result.finalOutput || 'No response generated.';

  console.log('[ChatKit] Got response:', fullText);

  // Save user message to database
  const userMessageId = `msg_user_${Date.now()}`;
  try {
    await store.addThreadItem(threadId, {
      item_type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: userMessage }],
      status: 'completed',
      metadata: {},
    });
  } catch (error) {
    console.error('[ChatKit] Failed to save user message:', error);
    // Continue anyway - we'll still stream the response
  }

  // Save assistant message to database
  const messageId = `msg_${Date.now() + 1}`;
  try {
    await store.addThreadItem(threadId, {
      item_type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: fullText, annotations: [] }],
      status: 'completed',
      metadata: {},
    });
  } catch (error) {
    console.error('[ChatKit] Failed to save assistant message:', error);
    // Continue anyway - we'll still stream the response
  }

  const now = new Date().toISOString();

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

  // Initialize ChatKit store
  const store = await createChatKitStore();

  // Load thread to get context
  const thread = await store.loadThread(threadId);
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  // Verify user owns the thread
  if (thread.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Load previous messages for context
  const previousItems = await store.loadThreadItems(threadId);
  const conversationHistory = previousItems
    .filter(item => item.item_type === 'message' && item.role)
    .map(item => {
      const textContent = Array.isArray(item.content)
        ? item.content.find((c: any) => c.text)?.text
        : '';
      return `${item.role}: ${textContent}`;
    })
    .join('\n');

  // Get agent configuration from metadata or thread
  const agentType = metadata?.agentType || thread.agent_type;
  const eventId = metadata?.eventId || thread.event_id;
  const venueId = metadata?.venueId || thread.venue_id;

  console.log('[ChatKit] Agent type:', agentType, 'Event ID:', eventId, 'Venue ID:', venueId);

  // Build context and generate instructions based on agent type
  const supabase = await createClient();
  let instructions: string;

  try {
    if (agentType === 'client' && eventId) {
      console.log('[ChatKit] Building client context for event:', eventId);
      const context = await buildClientContext(supabase, userId, eventId);
      instructions = generateClientSystemPrompt(context as any);
    } else if (agentType === 'venue_general' && venueId) {
      console.log('[ChatKit] Building venue general context for venue:', venueId);
      const context = await buildVenueGeneralContext(supabase, venueId);
      instructions = generateVenueGeneralSystemPrompt(context as any);
    } else if (agentType === 'venue_event' && venueId && eventId) {
      console.log('[ChatKit] Building venue event context for event:', eventId);
      const context = await buildVenueEventContext(supabase, venueId, eventId);
      instructions = generateVenueEventSystemPrompt(context as any);
    } else {
      // Fallback for missing context
      console.warn('[ChatKit] Missing required IDs for agent type:', agentType, { eventId, venueId });
      instructions = 'You are a helpful AI assistant for White Glove, an event planning platform. Help users with their questions about events, venues, and planning.';
    }

    // Add conversation history to instructions for continuity
    if (conversationHistory) {
      instructions += `\n\n## Previous Messages in This Conversation:\n${conversationHistory}`;
    }
  } catch (error) {
    console.error('[ChatKit] Failed to build context:', error);
    instructions = 'You are a helpful AI assistant for White Glove, an event planning platform. Help users with their questions about events, venues, and planning.';

    // Still add conversation history even on fallback
    if (conversationHistory) {
      instructions += `\n\n## Previous Messages in This Conversation:\n${conversationHistory}`;
    }
  }

  // Get tools for this agent type
  const tools = getToolsForAgent(agentType);

  // Create agent
  const agent = new Agent({
    name: 'White Glove Assistant',
    model: 'gpt-5',
    instructions,
    tools,
  });

  console.log('[ChatKit] Running agent...');
  console.log('[ChatKit] Available tools:', tools.length);

  // Create tool context
  const toolContext: ToolContext = { userId, userType };

  // Create a runner with event logging
  const runner = new Runner();

  // Attach event listeners for tool execution logging
  runner.on('agent_tool_start', (context, agent, tool, details) => {
    console.log('[ChatKit] Tool called:', {
      name: tool.name,
      args: details.toolCall.input,
    });
  });

  runner.on('agent_tool_end', (context, agent, tool, result, details) => {
    console.log('[ChatKit] Tool completed:', {
      name: tool.name,
      resultLength: result ? result.length : 0,
    });
  });

  // Run the agent with context
  const result = await runner.run(agent, userMessage, { context: toolContext });
  const fullText = result.finalOutput || 'No response generated.';

  console.log('[ChatKit] Got response:', fullText);

  // Save user message to database
  try {
    await store.addThreadItem(threadId, {
      item_type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: userMessage }],
      status: 'completed',
      metadata: {},
    });
  } catch (error) {
    console.error('[ChatKit] Failed to save user message:', error);
  }

  // Save assistant message to database
  try {
    await store.addThreadItem(threadId, {
      item_type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: fullText, annotations: [] }],
      status: 'completed',
      metadata: {},
    });
  } catch (error) {
    console.error('[ChatKit] Failed to save assistant message:', error);
  }

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
/**
 * Handle threads.list request
 */
async function handleThreadsList(userId: string, params: any) {
  console.log('[ChatKit] Listing threads for user:', userId);
  console.log('[ChatKit] Params:', params);

  const store = await createChatKitStore();

  const limit = params?.limit || 20;
  const offset = params?.offset || 0;

  console.log('[ChatKit] Loading threads with limit:', limit, 'offset:', offset);
  const threads = await store.listThreads(userId, { limit, offset });
  console.log('[ChatKit] Loaded', threads.length, 'threads');

  // Convert to ChatKit protocol format
  const data = threads.map(thread => ({
    id: thread.thread_id,
    created_at: thread.created_at,
    title: thread.title,
    metadata: thread.metadata,
    status: { type: 'active' },
  }));

  const response = {
    data,
    has_more: threads.length === limit,
    after: threads.length > 0 ? threads[threads.length - 1].thread_id : null,
  };

  console.log('[ChatKit] threads.list response:', JSON.stringify(response, null, 2));
  return NextResponse.json(response);
}

/**
 * Handle threads.get_by_id request
 */
async function handleThreadGetById(userId: string, params: any) {
  console.log('[ChatKit] Getting thread by ID:', params?.thread_id);
  console.log('[ChatKit] User ID:', userId);

  const threadId = params?.thread_id;
  if (!threadId) {
    console.error('[ChatKit] No thread_id provided');
    return NextResponse.json({ error: 'thread_id is required' }, { status: 400 });
  }

  console.log('[ChatKit] Initializing store...');
  const store = await createChatKitStore();

  console.log('[ChatKit] Loading thread from database...');
  let thread;
  try {
    thread = await store.loadThread(threadId);
    console.log('[ChatKit] Thread loaded:', thread ? 'SUCCESS' : 'NULL');
    if (thread) {
      console.log('[ChatKit] Thread data:', JSON.stringify(thread, null, 2));
    }
  } catch (error) {
    console.error('[ChatKit] Error loading thread:', error);
    return NextResponse.json({ error: 'Failed to load thread', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }

  if (!thread) {
    console.error('[ChatKit] Thread not found in database');
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  // Verify user owns the thread
  console.log('[ChatKit] Verifying ownership - thread.user_id:', thread.user_id, 'userId:', userId);
  if (thread.user_id !== userId) {
    console.error('[ChatKit] User does not own this thread');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Load thread items
  console.log('[ChatKit] Loading thread items...');
  let items;
  try {
    items = await store.loadThreadItems(threadId);
    console.log('[ChatKit] Items loaded:', items.length, 'items');
    console.log('[ChatKit] Items data:', JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('[ChatKit] Error loading items:', error);
    return NextResponse.json({ error: 'Failed to load items', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }

  // Convert to ChatKit protocol format
  console.log('[ChatKit] Converting items to ChatKit format...');
  const itemsData = items.map(item => {
    const converted: any = {
      id: item.item_id,
      thread_id: item.thread_id,
      type: item.role === 'user' ? 'user_message' : item.role === 'assistant' ? 'assistant_message' : 'message',
      content: item.content,
      created_at: item.created_at,
    };

    // Add fields that are present in streaming events
    if (item.role === 'user') {
      converted.attachments = [];
      converted.inference_options = {};
    }

    // Only include status if it exists
    if (item.status) {
      converted.status = item.status;
    }

    console.log('[ChatKit] Converted item:', JSON.stringify(converted, null, 2));
    return converted;
  });

  const response = {
    id: thread.thread_id,
    created_at: thread.created_at,
    title: thread.title,
    metadata: thread.metadata,
    status: { type: 'active' },
    items: {
      data: itemsData,
      has_more: false,
      after: null,
    },
  };

  console.log('[ChatKit] Returning response:', JSON.stringify(response, null, 2));
  console.log('[ChatKit] Response status: 200, Content-Type: application/json');
  return NextResponse.json(response);
}

/**
 * Handle items.list request
 */
async function handleItemsList(userId: string, params: any) {
  console.log('[ChatKit] Listing items for thread:', params?.thread_id);

  const threadId = params?.thread_id;
  if (!threadId) {
    return NextResponse.json({ error: 'thread_id is required' }, { status: 400 });
  }

  const store = await createChatKitStore();
  const thread = await store.loadThread(threadId);

  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  // Verify user owns the thread
  if (thread.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const limit = params?.limit || 100;
  const offset = params?.offset || 0;

  const items = await store.loadThreadItems(threadId, { limit, offset });

  // Convert to ChatKit protocol format
  const data = items.map(item => {
    const converted: any = {
      id: item.item_id,
      thread_id: item.thread_id,
      type: item.role === 'user' ? 'user_message' : item.role === 'assistant' ? 'assistant_message' : 'message',
      content: item.content,
      created_at: item.created_at,
    };

    // Add fields that are present in streaming events
    if (item.role === 'user') {
      converted.attachments = [];
      converted.inference_options = {};
    }

    // Only include status if it exists
    if (item.status) {
      converted.status = item.status;
    }

    return converted;
  });

  return NextResponse.json({
    data,
    has_more: items.length === limit,
    after: items.length > 0 ? items[items.length - 1].item_id : null,
  });
}

/**
 * Handle items.feedback request
 */
async function handleFeedback(userId: string, params: any) {
  console.log('[ChatKit] Feedback received:', params);

  const itemId = params?.item_id;
  const feedbackType = params?.feedback_type; // e.g., 'thumbs_up', 'thumbs_down'
  const comment = params?.comment;

  if (!itemId) {
    return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
  }

  const store = await createChatKitStore();

  // Update item metadata with feedback
  try {
    const item = await store.updateThreadItem(itemId, {
      metadata: {
        feedback: {
          type: feedbackType,
          comment,
          user_id: userId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log('[ChatKit] Feedback saved for item:', itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ChatKit] Failed to save feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
