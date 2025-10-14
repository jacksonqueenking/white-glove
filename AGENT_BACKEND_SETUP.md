# Agent Chat Backend - Setup Complete

## ✅ What Was Built

The agent chat backend is now fully functional using OpenAI's Agents SDK. You have two API endpoints for processing chat messages with AI agents.

## API Endpoints

### 1. Standard Chat Endpoint
**POST /api/chat**

Process a single message and return the complete response.

```typescript
// Request
POST /api/chat
Content-Type: application/json

{
  "message": "What elements do I have selected?",
  "agentType": "client",
  "eventId": "event_123",
  "venueId": "venue_456" // Only for venue agents
}

// Response
{
  "response": "You currently have 3 elements selected: Catering ($8,000), Photography ($2,000), and Venue Rental ($2,500). Total: $12,500.",
  "agentType": "client",
  "contextSummary": {
    "eventId": "event_123",
    "venueId": null
  }
}
```

### 2. Streaming Chat Endpoint
**POST /api/chat/stream**

Stream responses in real-time using Server-Sent Events.

```typescript
// Request
POST /api/chat/stream
Content-Type: application/json

{
  "message": "Create a task for the photographer",
  "agentType": "venue_event",
  "eventId": "event_123",
  "venueId": "venue_456"
}

// Response (Server-Sent Events)
data: {"type":"start"}

data: {"type":"chunk","content":"I'll"}

data: {"type":"chunk","content":" create"}

data: {"type":"chunk","content":" that"}

data: {"type":"chunk","content":" task"}

data: {"type":"done","response":"I'll create that task for the photographer."}
```

## Agent Types

### 1. Client Agent
```typescript
{
  "agentType": "client",
  "eventId": "required",
  "venueId": null
}
```

**Capabilities:**
- View and add event elements
- Manage guest list
- Complete client tasks
- Request changes from venue
- Search available offerings
- Send messages to venue

**Tools:** 10 tools including `add_element_to_event`, `add_guest`, `complete_task`, etc.

### 2. Venue Event Agent
```typescript
{
  "agentType": "venue_event",
  "eventId": "required",
  "venueId": "required"
}
```

**Capabilities:**
- Manage event status and details
- Add/remove/update event elements
- Create and assign tasks
- Manage guest lists
- Send messages to clients/vendors
- Update event element status

**Tools:** 14 tools including `update_event_status`, `create_task`, `add_element_to_event`, etc.

### 3. Venue General Agent
```typescript
{
  "agentType": "venue_general",
  "eventId": null,
  "venueId": "required"
}
```

**Capabilities:**
- List and manage all events
- Manage vendors and approvals
- Create/update venue offerings (elements)
- View venue dashboard statistics
- Get overdue tasks across events
- Send messages to clients/vendors

**Tools:** 10 tools including `list_events`, `create_event`, `list_vendors`, `create_element`, etc.

## Architecture

```
Client Request
      │
      ▼
API Route (/api/chat or /api/chat/stream)
      │
      ├─ Authentication (Supabase)
      ├─ Validate request parameters
      │
      ▼
Agent Creation (agentSDK.ts)
      │
      ├─ createClientAgent(clientId, eventId)
      ├─ createVenueGeneralAgent(venueId)
      └─ createVenueEventAgent(venueId, eventId)
            │
            ├─ Build context (context.ts)
            │   └─ Fetch event, guests, tasks, elements, etc.
            │
            ├─ Generate system prompt (prompts.ts)
            │   └─ Include all context in instructions
            │
            └─ Attach tools (tools.ts + toolHandlers.ts)
                └─ Convert to Agents SDK format
      │
      ▼
Run Agent (OpenAI Agents SDK)
      │
      ├─ Process message with GPT-4o
      ├─ Call tools as needed
      │   └─ Execute via toolHandlers.ts
      │       └─ Database operations (lib/db/*)
      │
      └─ Generate response
      │
      ▼
Return to client (JSON or Stream)
```

## Files Created/Modified

### New Files
1. **app/api/chat/route.ts** - Standard chat endpoint
2. **app/api/chat/stream/route.ts** - Streaming chat endpoint
3. **AGENT_BACKEND_SETUP.md** - This documentation

### Modified Files
1. **lib/agents/agentSDK.ts**
   - Fixed type errors
   - Corrected model name (gpt-4o)
   - Fixed `runAgent` function

## Testing the Backend

### Using curl

**Test standard endpoint:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "message": "What tasks need my attention?",
    "agentType": "client",
    "eventId": "your-event-id"
  }'
```

**Test streaming endpoint:**
```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "message": "List all upcoming events",
    "agentType": "venue_general",
    "venueId": "your-venue-id"
  }'
```

### Using JavaScript/TypeScript

```typescript
// Standard request
async function sendMessage(message: string, agentType: string, eventId?: string, venueId?: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      agentType,
      eventId,
      venueId,
    }),
  });

  const data = await response.json();
  return data.response;
}

// Usage
const answer = await sendMessage(
  "What's the status of my event?",
  "client",
  "event_123"
);
console.log(answer);
```

```typescript
// Streaming request
async function streamMessage(message: string, agentType: string) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      agentType,
      eventId: "event_123",
      venueId: "venue_456",
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        if (data.type === 'chunk') {
          process.stdout.write(data.content);
        } else if (data.type === 'done') {
          console.log('\nDone:', data.response);
        }
      }
    }
  }
}
```

## How Tools Work

When an agent needs to perform an action (like adding a guest or creating a task), it:

1. **Identifies the need** - Based on the user's message and context
2. **Calls a tool** - Uses the appropriate tool function
3. **Executes the handler** - `toolHandlers.ts` processes the request
4. **Validates permissions** - Checks user ownership and access
5. **Performs database operation** - Uses functions from `lib/db/*`
6. **Returns result** - Tool returns success/error to agent
7. **Incorporates in response** - Agent uses result to formulate answer

Example flow:
```
User: "Add a guest named John Smith"
  ↓
Agent calls tool: add_guest({ name: "John Smith", event_id: "..." })
  ↓
Handler validates: User owns this event?
  ↓
Handler calls: createGuest({ name: "John Smith", ... })
  ↓
Database: INSERT INTO guests ...
  ↓
Handler returns: { guest_id: "...", name: "John Smith", ... }
  ↓
Agent response: "I've added John Smith to your guest list."
```

## Context Provided to Agents

Each agent receives rich context about the current state:

### Client Agent Context
- Event details (name, date, venue, budget)
- Selected elements with vendors and pricing
- Guest list with RSVP status
- Pending tasks
- Recent action history
- Available offerings at the venue

### Venue Event Agent Context
- Event details
- Client information
- All event elements
- Tasks (all assignments)
- Guest list
- Messages related to the event
- Action history
- Available offerings

### Venue General Agent Context
- All events at the venue
- All tasks across events
- All messages (sent/received)
- All vendors and approval status
- All offerings/elements
- Aggregated statistics

This context is automatically included in the system prompt, so agents can answer questions and make decisions based on current state.

## Error Handling

The API handles various error cases:

1. **401 Unauthorized** - No valid session
2. **400 Bad Request** - Missing or invalid parameters
3. **500 Internal Server Error** - Agent creation or execution failed

All errors return JSON:
```json
{
  "error": "Error message",
  "details": "More specific error information"
}
```

## Performance Considerations

- **Agent creation** (~500ms) - Builds context from database
- **Tool execution** (varies) - Depends on database operations
- **LLM inference** (~2-5s) - GPT-4o processing time
- **Streaming** - Starts responding immediately, chunks arrive progressively

For best performance:
- Use streaming endpoint for better UX
- Cache agent instances if making multiple requests
- Consider background job processing for complex tool chains

## Next Steps

1. **Integrate with ChatKit** - Update ChatKitWrapper to use these endpoints
2. **Add conversation history** - Store and retrieve past messages
3. **Implement handoffs** - Allow agents to transfer between types
4. **Add structured outputs** - Use Agents SDK structured output feature
5. **Monitoring** - Add logging and analytics
6. **Rate limiting** - Implement per-user limits

## Example Complete Interaction

```
User: "I need to add my friend Sarah to the guest list and make sure she's marked as vegetarian"

Agent Process:
1. Receives message
2. Understands needs: add guest + dietary restriction
3. Calls tool: add_guest({
     name: "Sarah",
     event_id: "event_123",
     dietary_restrictions: "vegetarian"
   })
4. Handler validates client owns event
5. Handler creates guest in database
6. Tool returns success with guest details
7. Agent formulates response

Response: "I've added Sarah to your guest list and noted her vegetarian dietary preference. She's been marked as 'undecided' for RSVP status. Would you like me to help with anything else for your guest list?"
```

## Summary

✅ Agent backend fully functional
✅ Two API endpoints (standard + streaming)
✅ Three agent types with full tool access
✅ Comprehensive context building
✅ Permission validation
✅ Database integration
✅ Error handling

The agent chat backend is ready for integration with the ChatKit UI!
