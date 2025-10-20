/**
 * ChatKit Custom Backend API
 *
 * Implements the OpenAI ChatKit protocol using Supabase for storage.
 * Based on: https://github.com/openai/chatkit-python/blob/main/docs/server.md
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatKitStore, type ThreadMetadata } from '@/lib/chatkit/store';
import {
  createClientAgent,
  createVenueGeneralAgent,
  createVenueEventAgent,
} from '@/lib/agents/agentSDK';
import { run } from '@openai/agents';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/chatkit
 *
 * Single endpoint handling all ChatKit protocol requests
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body = await request.json();
    console.log('[ChatKit] Request:', JSON.stringify(body, null, 2));

    const { type, params, metadata } = body;

    // Create store
    const store = new ChatKitStore(supabase);

    // Route based on request type
    switch (type) {
      case 'threads.create':
        return await handleThreadsCreate(user.id, store, supabase, params, metadata);

      case 'threads.list':
        return await handleThreadsList(user.id, store, params);

      case 'threads.get':
      case 'threads.get_by_id':
        return await handleThreadsGet(store, params);

      case 'threads.update':
        return await handleThreadsUpdate(store, params);

      case 'threads.delete':
        return await handleThreadsDelete(store, params);

      case 'threads.add_user_message':
        return await handleThreadsAddUserMessage(user.id, store, supabase, params, metadata);

      default:
        console.error('[ChatKit] Unknown request type:', type);
        return new Response(
          JSON.stringify({ error: 'Unknown request type', type }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[ChatKit] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle threads.create - Create a new thread and process the initial message
 * Returns Server-Sent Events for streaming response
 */
async function handleThreadsCreate(
  userId: string,
  store: ChatKitStore,
  supabase: any,
  params: any,
  metadata: any
) {
  const { input } = params;
  const userMessage = input?.content?.[0]?.text || '';

  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'Message text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract agent configuration from metadata
  const agentType = metadata?.agentType as 'client' | 'venue_general' | 'venue_event';
  const eventId = metadata?.eventId;
  const venueId = metadata?.venueId;
  const userType = metadata?.userType || 'client';

  if (!agentType) {
    return new Response(JSON.stringify({ error: 'agentType required in metadata' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create encoder for SSE
  const encoder = new TextEncoder();

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create thread with title from first message
        const threadTitle = userMessage.length > 50
          ? userMessage.substring(0, 50) + '...'
          : userMessage;

        const threadMetadata: ThreadMetadata = {
          user_id: userId,
          user_type: userType,
          agent_type: agentType,
          event_id: eventId,
          venue_id: venueId,
          title: threadTitle,
          ...metadata,
        };

        const thread = await store.createThread(threadMetadata);

        // Send thread.created event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'thread.created',
            thread: {
              id: thread.thread_id,
              created_at: Math.floor(new Date(thread.created_at).getTime() / 1000),
              metadata: thread.metadata,
              title: thread.title || null,
            },
          })}\n\n`)
        );

        // Add user message to thread
        const userItem = await store.addThreadItem(thread.thread_id, {
          item_type: 'message',
          role: 'user',
          content: { type: 'text', text: userMessage },
          metadata: {},
        });

        // Send thread.item.done event for user message (per ChatKit Python SDK spec)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'thread.item.done',
            item: {
              id: userItem.item_id,
              thread_id: thread.thread_id,
              created_at: new Date(userItem.created_at).toISOString(),
              content: userItem.content,
            },
          })}\n\n`)
        );

        // Create and run agent
        let agent;
        switch (agentType) {
          case 'client':
            if (!eventId) throw new Error('eventId required for client agent');
            ({ agent } = await createClientAgent(supabase, userId, eventId));
            break;
          case 'venue_general':
            if (!venueId) throw new Error('venueId required for venue_general agent');
            ({ agent } = await createVenueGeneralAgent(supabase, venueId));
            break;
          case 'venue_event':
            if (!eventId || !venueId) {
              throw new Error('eventId and venueId required for venue_event agent');
            }
            ({ agent } = await createVenueEventAgent(supabase, venueId, eventId));
            break;
          default:
            throw new Error(`Invalid agent type: ${agentType}`);
        }

        // Run agent
        const result = await run(agent, userMessage);
        const responseText = result.finalOutput || 'I apologize, but I encountered an error.';

        console.log('[ChatKit] Agent response:', responseText);

        // Add assistant message to thread
        const assistantItem = await store.addThreadItem(thread.thread_id, {
          item_type: 'message',
          role: 'assistant',
          content: { type: 'text', text: responseText },
          metadata: {},
        });

        // Send thread.item.done event for assistant message (per ChatKit Python SDK spec)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'thread.item.done',
          item: {
            id: assistantItem.item_id,
            thread_id: thread.thread_id,
            created_at: new Date(assistantItem.created_at).toISOString(),
            content: assistantItem.content,
          },
        })}\n\n`));

        controller.close();
      } catch (error) {
        console.error('[ChatKit] Stream error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Handle threads.list - List threads for the user
 */
async function handleThreadsList(userId: string, store: ChatKitStore, params: any) {
  const { limit = 20, offset = 0 } = params || {};

  const threads = await store.listThreads(userId, { limit, offset });

  return new Response(
    JSON.stringify({
      data: threads.map(thread => ({
        id: thread.thread_id,
        created_at: Math.floor(new Date(thread.created_at).getTime() / 1000),
        updated_at: Math.floor(new Date(thread.updated_at).getTime() / 1000),
        metadata: thread.metadata,
        title: thread.title,
      })),
      has_more: threads.length === limit,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle threads.get - Get a specific thread with items
 */
async function handleThreadsGet(store: ChatKitStore, params: any) {
  const { thread_id } = params;

  if (!thread_id) {
    return new Response(JSON.stringify({ error: 'thread_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const thread = await store.loadThread(thread_id);

  if (!thread) {
    return new Response(JSON.stringify({ error: 'Thread not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const items = await store.loadThreadItems(thread_id);

  return new Response(
    JSON.stringify({
      thread: {
        id: thread.thread_id,
        created_at: Math.floor(new Date(thread.created_at).getTime() / 1000),
        updated_at: Math.floor(new Date(thread.updated_at).getTime() / 1000),
        metadata: thread.metadata,
        title: thread.title,
      },
      items: items.map(item => ({
        id: item.item_id,
        type: item.item_type,
        role: item.role,
        content: Array.isArray(item.content) ? item.content : [item.content],
        created_at: Math.floor(new Date(item.created_at).getTime() / 1000),
        status: item.status,
        metadata: item.metadata,
      })),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle threads.update - Update thread metadata
 */
async function handleThreadsUpdate(store: ChatKitStore, params: any) {
  const { thread_id, title, metadata } = params;

  if (!thread_id) {
    return new Response(JSON.stringify({ error: 'thread_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (metadata !== undefined) updates.metadata = metadata;

  const thread = await store.updateThread(thread_id, updates);

  return new Response(
    JSON.stringify({
      thread: {
        id: thread.thread_id,
        created_at: Math.floor(new Date(thread.created_at).getTime() / 1000),
        updated_at: Math.floor(new Date(thread.updated_at).getTime() / 1000),
        metadata: thread.metadata,
        title: thread.title,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle threads.delete - Delete a thread
 */
async function handleThreadsDelete(store: ChatKitStore, params: any) {
  const { thread_id } = params;

  if (!thread_id) {
    return new Response(JSON.stringify({ error: 'thread_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await store.deleteThread(thread_id);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle threads.add_user_message - Add a message to an existing thread
 * Returns Server-Sent Events for streaming response
 */
async function handleThreadsAddUserMessage(
  userId: string,
  store: ChatKitStore,
  supabase: any,
  params: any,
  metadata: any
) {
  const { thread_id, input } = params;
  const userMessage = input?.content?.[0]?.text || '';

  if (!thread_id) {
    return new Response(JSON.stringify({ error: 'thread_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'Message content is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract agent configuration from metadata
  const agentType = metadata?.agentType as 'client' | 'venue_general' | 'venue_event';
  const eventId = metadata?.eventId;
  const venueId = metadata?.venueId;

  if (!agentType) {
    return new Response(JSON.stringify({ error: 'agentType required in metadata' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create encoder for SSE
  const encoder = new TextEncoder();

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Load existing thread
        const thread = await store.loadThread(thread_id);
        if (!thread) {
          throw new Error('Thread not found');
        }

        // Add user message to thread
        const userItem = await store.addThreadItem(thread.thread_id, {
          item_type: 'message',
          role: 'user',
          content: { type: 'text', text: userMessage },
          metadata: {},
        });

        // Send thread.item.done event for user message (per ChatKit Python SDK spec)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'thread.item.done',
            item: {
              id: userItem.item_id,
              thread_id: thread.thread_id,
              created_at: new Date(userItem.created_at).toISOString(),
              content: userItem.content,
            },
          })}\n\n`)
        );

        // Create and run agent
        let agent;
        switch (agentType) {
          case 'client':
            if (!eventId) throw new Error('eventId required for client agent');
            ({ agent } = await createClientAgent(supabase, userId, eventId));
            break;
          case 'venue_general':
            if (!venueId) throw new Error('venueId required for venue_general agent');
            ({ agent } = await createVenueGeneralAgent(supabase, venueId));
            break;
          case 'venue_event':
            if (!eventId || !venueId) {
              throw new Error('eventId and venueId required for venue_event agent');
            }
            ({ agent } = await createVenueEventAgent(supabase, venueId, eventId));
            break;
          default:
            throw new Error(`Invalid agent type: ${agentType}`);
        }

        // Run agent
        const result = await run(agent, userMessage);
        const responseText = result.finalOutput || 'I apologize, but I encountered an error.';

        console.log('[ChatKit] Agent response:', responseText);

        // Add assistant message to thread
        const assistantItem = await store.addThreadItem(thread.thread_id, {
          item_type: 'message',
          role: 'assistant',
          content: { type: 'text', text: responseText },
          metadata: {},
        });

        // Send thread.item.done event for assistant message (per ChatKit Python SDK spec)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'thread.item.done',
          item: {
            id: assistantItem.item_id,
            thread_id: thread.thread_id,
            created_at: new Date(assistantItem.created_at).toISOString(),
            content: assistantItem.content,
          },
        })}\n\n`));

        controller.close();
      } catch (error) {
        console.error('[ChatKit] Stream error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * GET /api/chatkit - Health check
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      protocol: 'chatkit',
      version: '1.0.0',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
