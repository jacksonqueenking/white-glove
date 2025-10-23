# Migration Next Steps - Implementation Guide

## Quick Start: Test Your Current Setup

```bash
npm run dev
```

Then navigate to any page that uses the chat components. The basic streaming chat should work now!

---

## Phase 2A: Add Chat History Persistence

### Step 1: Create Persistence Utility

Create `lib/chat/persistence.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface SaveChatOptions {
  chatId: string;
  userId: string;
  userType: 'client' | 'venue' | 'vendor';
  agentType: 'client' | 'venue_general' | 'venue_event';
  eventId?: string;
  venueId?: string;
  messages: ChatMessage[];
}

export async function saveChat(
  supabase: SupabaseClient,
  options: SaveChatOptions
) {
  const { chatId, userId, userType, agentType, eventId, venueId, messages } = options;

  // Create or update thread
  const { data: existingThread } = await supabase
    .from('chatkit_threads')
    .select('*')
    .eq('thread_id', chatId)
    .single();

  if (!existingThread) {
    // Create new thread
    await supabase.from('chatkit_threads').insert({
      thread_id: chatId,
      user_id: userId,
      user_type: userType,
      agent_type: agentType,
      event_id: eventId || null,
      venue_id: venueId || null,
      title: messages[0]?.content?.substring(0, 100) || 'New conversation',
      metadata: {},
    });
  }

  // Save new messages
  for (const message of messages) {
    // Check if message already exists
    const { data: existing } = await supabase
      .from('chatkit_thread_items')
      .select('item_id')
      .eq('item_id', message.id)
      .single();

    if (!existing) {
      await supabase.from('chatkit_thread_items').insert({
        item_id: message.id,
        thread_id: chatId,
        role: message.role,
        content: [{ type: 'text', text: message.content }],
        item_type: 'message',
        status: 'completed',
        metadata: message.metadata || {},
        created_at: message.createdAt || new Date().toISOString(),
      });
    }
  }

  // Update thread timestamp
  await supabase
    .from('chatkit_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('thread_id', chatId);
}

export async function loadChat(supabase: SupabaseClient, chatId: string, userId: string) {
  // Load thread
  const { data: thread, error: threadError } = await supabase
    .from('chatkit_threads')
    .select('*')
    .eq('thread_id', chatId)
    .eq('user_id', userId)
    .single();

  if (threadError || !thread) {
    return null;
  }

  // Load messages
  const { data: items } = await supabase
    .from('chatkit_thread_items')
    .select('*')
    .eq('thread_id', chatId)
    .order('created_at', { ascending: true });

  const messages: ChatMessage[] = (items || []).map(item => ({
    id: item.item_id,
    role: item.role as 'user' | 'assistant',
    content: Array.isArray(item.content)
      ? item.content.find((c: any) => c.type === 'text')?.text || ''
      : '',
    createdAt: item.created_at,
    metadata: item.metadata,
  }));

  return {
    thread,
    messages,
  };
}

export async function listChats(
  supabase: SupabaseClient,
  userId: string,
  options?: { eventId?: string; venueId?: string; limit?: number }
) {
  let query = supabase
    .from('chatkit_threads')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (options?.eventId) {
    query = query.eq('event_id', options.eventId);
  }

  if (options?.venueId) {
    query = query.eq('venue_id', options.venueId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return data || [];
}
```

### Step 2: Update API Route to Save Messages

Edit `app/api/chat/route.ts`:

```typescript
import { saveChat } from '@/lib/chat/persistence';

// ... existing code ...

export async function POST(request: NextRequest) {
  // ... existing auth and setup code ...

  const { messages, chatId, agentType, eventId, venueId } = body;
  const finalChatId = chatId || `chat-${Date.now()}`;

  // ... existing context building code ...

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: modelMessages,
  });

  // Return streaming response WITH persistence
  return result.toTextStreamResponse({
    headers: {
      'X-Chat-Id': finalChatId, // Return chat ID to client
    },
    onFinish: async ({ text, finishReason }) => {
      // Save the conversation to database
      console.log('[Chat API] Saving messages to database...');

      // Reconstruct full message array including assistant response
      const allMessages = [
        ...messages,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: text,
          createdAt: new Date().toISOString(),
        },
      ];

      await saveChat(supabase, {
        chatId: finalChatId,
        userId: user.id,
        userType,
        agentType,
        eventId,
        venueId,
        messages: allMessages,
      });

      console.log('[Chat API] Messages saved successfully');
    },
  });
}
```

### Step 3: Create Load Chat Endpoint

Create `app/api/chat/[chatId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadChat } from '@/lib/chat/persistence';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const chat = await loadChat(supabase, params.chatId, user.id);

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  return NextResponse.json(chat);
}
```

### Step 4: Update UI to Load History

Edit `components/chat/ChatInterface.tsx`:

```typescript
// Add this hook at the top level
import { useEffect } from 'react';

export function ChatInterface({ chatId, ...props }: ChatInterfaceProps) {
  const [loadedMessages, setLoadedMessages] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(!!chatId);

  // Load chat history if chatId is provided
  useEffect(() => {
    if (chatId) {
      fetch(`/api/chat/${chatId}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setLoadedMessages(data.messages);
          }
        })
        .catch(err => console.error('Failed to load chat:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [chatId]);

  const { messages, append, ...rest } = useChat({
    api: '/api/chat',
    id: chatId || `chat-${Date.now()}`,
    initialMessages: loadedMessages,
    // ... rest of config
  });

  if (isLoadingHistory) {
    return <div>Loading chat history...</div>;
  }

  // ... rest of component
}
```

---

## Phase 2B: Migrate Tools to Vercel AI SDK

### Example Tool Migration

**Before (OpenAI Agents SDK):**
```typescript
import { tool } from '@openai/agents';

export const getElementDetailsTool = tool({
  name: 'get_element_details',
  description: 'Get full details of an available offering',
  parameters: z.object({
    element_id: z.string().uuid(),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const element = await getElement(supabase, input.element_id);
    return element;
  },
});
```

**After (Vercel AI SDK):**
```typescript
import { tool } from 'ai';

export const getElementDetailsTool = tool({
  description: 'Get full details of an available offering',
  parameters: z.object({
    element_id: z.string().uuid(),
  }),
  execute: async ({ element_id }, { toolCallId, messages }) => {
    // Get user from auth (no built-in context)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const element = await getElement(supabase, element_id);
    return element;
  },
});
```

### Create New Tools File

Create `lib/agents/tools-ai-sdk.ts`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getElement, isElementAvailable } from '@/lib/db/elements';
import { addElementToEvent } from '@/lib/db/event_elements';

// Helper to get authenticated user
async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { user, supabase };
}

export function getClientTools() {
  return {
    get_element_details: tool({
      description: 'Get full details of an available offering including description, pricing, and vendor info.',
      parameters: z.object({
        element_id: z.string().uuid().describe('Element UUID'),
      }),
      execute: async ({ element_id }) => {
        const { supabase } = await getAuthUser();
        const element = await getElement(supabase, element_id);
        return element;
      },
    }),

    add_element_to_event: tool({
      description: 'Add an offering to the client\'s event.',
      parameters: z.object({
        event_id: z.string().uuid().describe('Event UUID'),
        element_id: z.string().uuid().describe('Element UUID'),
        customization: z.string().nullable().describe('Special instructions'),
      }),
      execute: async ({ event_id, element_id, customization }) => {
        const { user, supabase } = await getAuthUser();

        // Verify ownership
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('event_id', event_id)
          .eq('client_id', user.id)
          .single();

        if (!event) {
          throw new Error('Event not found or unauthorized');
        }

        // Check availability
        const element = await getElement(supabase, element_id);
        if (!element) throw new Error('Element not found');

        const available = await isElementAvailable(
          supabase,
          element_id,
          event.date.toISOString()
        );

        if (!available) {
          throw new Error('Element is not available for this date');
        }

        const result = await addElementToEvent(supabase, {
          event_id,
          element_id,
          amount: element.price,
          status: 'to-do',
          customization: customization ?? undefined,
          contract_completed: false,
        });

        return result;
      },
    }),

    // Add more tools...
  };
}

export function getVenueGeneralTools() {
  return {
    // Venue tools...
  };
}

export function getVenueEventTools() {
  return {
    // Event tools...
  };
}

export function getToolsForAgentAISDK(
  agentType: 'client' | 'venue_general' | 'venue_event'
) {
  switch (agentType) {
    case 'client':
      return getClientTools();
    case 'venue_general':
      return getVenueGeneralTools();
    case 'venue_event':
      return getVenueEventTools();
    default:
      return {};
  }
}
```

### Add Tools to API Route

Edit `app/api/chat/route.ts`:

```typescript
import { getToolsForAgentAISDK } from '@/lib/agents/tools-ai-sdk';

// In the POST function:
const tools = getToolsForAgentAISDK(agentType);

const result = streamText({
  model: openai('gpt-4o'),
  system: systemPrompt,
  messages: modelMessages,
  tools, // Add this
  maxSteps: 5, // Enable multi-step
});
```

---

## Phase 2C: Add Thread List UI (Optional)

### Create Thread List Component

Create `components/chat/ThreadList.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Thread {
  thread_id: string;
  title: string;
  updated_at: string;
}

export function ThreadList({
  onSelectThread,
  currentThreadId
}: {
  onSelectThread: (threadId: string) => void;
  currentThreadId?: string;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chat/threads')
      .then(res => res.json())
      .then(data => setThreads(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-64 border-r bg-gray-50 p-4 space-y-2">
      <button
        onClick={() => onSelectThread('')}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        + New Chat
      </button>

      {threads.map(thread => (
        <button
          key={thread.thread_id}
          onClick={() => onSelectThread(thread.thread_id)}
          className={`w-full px-4 py-2 text-left rounded-lg ${
            currentThreadId === thread.thread_id
              ? 'bg-blue-100'
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          <div className="font-medium truncate">{thread.title}</div>
          <div className="text-xs text-gray-500">
            {new Date(thread.updated_at).toLocaleDateString()}
          </div>
        </button>
      ))}
    </div>
  );
}
```

---

## Testing Checklist

### Phase 2A: Persistence
- [ ] Messages save to database after each response
- [ ] Can load previous conversations
- [ ] Thread list shows recent chats
- [ ] Refresh doesn't lose messages

### Phase 2B: Tools
- [ ] Tool calls work (e.g., "show me available catering")
- [ ] Tool results appear in chat
- [ ] Multiple tools can be called in sequence
- [ ] Database operations complete successfully

### Phase 2C: UI
- [ ] Can switch between conversations
- [ ] New chat button works
- [ ] Thread titles update automatically
- [ ] Timestamps display correctly

---

## Common Issues & Solutions

### Issue: "Messages not saving"
**Solution**: Check `onFinish` callback is being called. Add console.logs.

### Issue: "Tools not being called"
**Solution**: Make sure `tools` is passed to `streamText()` and `maxSteps` is set.

### Issue: "Context lost between messages"
**Solution**: Ensure `initialMessages` is set when loading a chat.

### Issue: "Auth errors in tools"
**Solution**: Use server-side `createClient()` in tools, not client-side.

---

## Need Help?

Ask about:
- Specific tool migration patterns
- Error handling strategies
- Performance optimization
- Multi-tenant considerations

Happy coding! 🚀
