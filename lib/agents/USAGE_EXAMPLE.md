# AI Agent System Usage Example

## Complete Implementation Example

Here's a complete example of how to implement an AI agent chat interface using the system.

### 1. API Route Handler

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  buildClientContext,
  generateClientSystemPrompt,
  clientTools,
  executeToolCall,
} from '@/lib/agents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { clientId, eventId, messages } = await request.json();

  try {
    // Step 1: Build context with fresh data
    const context = await buildClientContext(clientId, eventId);

    // Step 2: Generate system prompt
    const systemPrompt = generateClientSystemPrompt(context);

    // Step 3: Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Step 4: Call OpenAI with tools
    let response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages as any,
      tools: clientTools,
      tool_choice: 'auto',
    });

    // Step 5: Handle tool calls if any
    while (response.choices[0].message.tool_calls) {
      const toolCalls = response.choices[0].message.tool_calls;

      // Add assistant message with tool calls
      openaiMessages.push(response.choices[0].message as any);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const result = await executeToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
          { userId: clientId, userType: 'client' },
          'client'
        );

        // Add tool result to messages
        openaiMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        } as any);
      }

      // Get next response with tool results
      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: openaiMessages,
        tools: clientTools,
        tool_choice: 'auto',
      });
    }

    // Step 6: Return final response
    return NextResponse.json({
      message: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
```

### 2. Client Component

```typescript
// components/chat/ClientChatInterface.tsx
'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ClientChatInterface({
  clientId,
  eventId,
}: {
  clientId: string;
  eventId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          eventId,
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your event planning assistant..."
            className="flex-1 border rounded-lg px-4 py-2"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Venue Event Agent Example

```typescript
// app/api/venue/event-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  buildVenueEventContext,
  generateVenueEventSystemPrompt,
  venueEventTools,
  executeToolCall,
} from '@/lib/agents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { venueId, eventId, messages } = await request.json();

  try {
    // Build event-specific context
    const context = await buildVenueEventContext(venueId, eventId);

    // Generate event-specific prompt
    const systemPrompt = generateVenueEventSystemPrompt(context);

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    let response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages as any,
      tools: venueEventTools,
      tool_choice: 'auto',
    });

    // Handle tool calls
    while (response.choices[0].message.tool_calls) {
      const toolCalls = response.choices[0].message.tool_calls;
      openaiMessages.push(response.choices[0].message as any);

      for (const toolCall of toolCalls) {
        const result = await executeToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
          { userId: venueId, userType: 'venue' },
          'venue_event'
        );

        openaiMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        } as any);
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: openaiMessages,
        tools: venueEventTools,
        tool_choice: 'auto',
      });
    }

    return NextResponse.json({
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('Venue event chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

### 4. Streaming Response Example

For better UX, implement streaming responses:

```typescript
// app/api/chat/stream/route.ts
import OpenAI from 'openai';
import {
  buildClientContext,
  generateClientSystemPrompt,
  clientTools,
} from '@/lib/agents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { clientId, eventId, messages } = await request.json();

  const context = await buildClientContext(clientId, eventId);
  const systemPrompt = generateClientSystemPrompt(context);

  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    tools: clientTools,
    stream: true,
  });

  // Create a ReadableStream for the response
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### 5. Testing Your Implementation

```typescript
// __tests__/chat-api.test.ts
import { POST } from '@/app/api/chat/route';

describe('Chat API', () => {
  it('should process client message', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'test-client',
        eventId: 'test-event',
        messages: [
          { role: 'user', content: 'What catering options are available?' },
        ],
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(data).toHaveProperty('message');
    expect(typeof data.message).toBe('string');
  });
});
```

## Best Practices

1. **Always refresh context** - Build context on each request with fresh database data
2. **Handle errors gracefully** - Wrap tool calls in try-catch and return user-friendly errors
3. **Validate permissions** - Tool handlers check ownership before executing
4. **Log tool usage** - Track which tools are called for analytics and debugging
5. **Rate limit** - Implement rate limiting on API routes
6. **Cache prompts** - Consider caching system prompts if context doesn't change frequently
7. **Monitor costs** - Track OpenAI API usage and set budgets
8. **Test thoroughly** - Test each tool handler independently before integration

## Troubleshooting

### Issue: Tool calls not executing
- Verify tool names match exactly
- Check executeToolCall is called with correct agent type
- Ensure permissions are properly validated

### Issue: Context too large
- Use the appropriate agent (general vs event-specific)
- Limit action history to last 20-30 items
- Paginate large guest lists

### Issue: Slow responses
- Implement streaming for better UX
- Consider caching system prompts
- Use parallel tool execution where possible

## Next Steps

- Add conversation history persistence
- Implement suggested replies
- Add multi-turn conversation optimization
- Create custom instructions per client
- Add voice interface support
