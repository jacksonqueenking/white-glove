# ChatKit Integration

## Overview

The platform uses **OpenAI ChatKit** for the chat UI and **OpenAI Agents SDK** for AI agent orchestration. ChatKit provides a production-ready chat interface while the Agents SDK handles the AI logic, tool execution, and conversation management.

---

## Architecture

```
┌─────────────────────────┐
│   ChatKit React UI      │  Frontend - Production chat interface
│   (@openai/chatkit-js)  │
└───────────┬─────────────┘
            │ Custom API Config
            ▼
┌─────────────────────────┐
│  /api/chatkit/route.ts  │  Backend - ChatKit protocol handler
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  OpenAI Agents SDK      │  AI - Agent orchestration
│  - Client Agent         │
│  - Venue General Agent  │
│  - Venue Event Agent    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Tool Handlers          │  Business logic execution
│  - Database operations  │
│  - Messaging            │
│  - Task management      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Supabase Storage       │  Persistence
│  - chatkit_threads      │
│  - chatkit_thread_items │
└─────────────────────────┘
```

---

## Agent Types

### 1. Client Agent

**Purpose:** Help clients plan their events through conversational AI

**Required metadata:**
- `clientId` - Client user ID
- `eventId` - Event being planned
- `agentType` - `"client"`

**Context provided to agent:**
- Client information and preferences
- Event details (date, venue, guest count, budget)
- Selected elements and their status
- Available venue services and vendors
- Past conversation history

**Available tools:**
- `getEventDetails` - Retrieve full event information
- `listAvailableElements` - Show venue offerings
- `requestElementChange` - Propose changes to event elements
- `viewGuestList` - Access guest list
- `addGuest` - Add guests to event
- `viewContract` - Show contract and pricing

**Example usage:**
```tsx
import { ChatKitWrapper } from '@/components/chat/ChatKitWrapper';

<ChatKitWrapper
  agentType="client"
  eventId={eventId}
  title="Plan Your Event"
  subtitle="Ask me anything about your event"
  className="h-[600px]"
/>
```

**Example interaction:**
```
Client: "Can we add more vegetarian options?"
Agent: "I can help with that! Your current menu has one vegetarian option.
       Let me check with the caterer about additional options..."
```

---

### 2. Venue General Agent

**Purpose:** Help venue staff manage operations across all events

**Required metadata:**
- `venueId` - Venue user ID
- `agentType` - `"venue_general"`

**Context provided to agent:**
- Venue information
- All events (current and upcoming)
- Vendor relationships
- Task summaries across all events
- Message threads overview

**Available tools:**
- `listEvents` - Show all venue events
- `getEventSummary` - Quick overview of specific event
- `listVendors` - Show approved vendors
- `listPendingTasks` - Show tasks needing attention
- `searchMessages` - Find specific communications

**Example usage:**
```tsx
<ChatKitWrapper
  agentType="venue_general"
  venueId={venueId}
  title="Venue Assistant"
  subtitle="Manage your events and operations"
  className="h-[600px]"
/>
```

**Example interaction:**
```
Venue: "What's happening this weekend?"
Agent: "You have 3 events this weekend:
       - Smith Wedding (Sat, 6pm) - All confirmed
       - Johnson Birthday (Sat, 2pm) - Awaiting final guest count
       - Martinez Corporate (Sun, 11am) - 2 pending vendor confirmations"
```

---

### 3. Venue Event Agent

**Purpose:** Help venue staff coordinate a specific event

**Required metadata:**
- `venueId` - Venue user ID
- `eventId` - Specific event ID
- `agentType` - `"venue_event"`

**Context provided to agent:**
- Full event details
- Client information
- All event elements and status
- Vendor assignments
- Event-specific tasks
- Communication history for this event

**Available tools:**
- `getEventDetails` - Full event information
- `updateElementStatus` - Change element status
- `sendMessageToClient` - Communicate with client
- `sendMessageToVendor` - Coordinate with vendor
- `createTask` - Assign tasks
- `updateEvent` - Modify event details

**Example usage:**
```tsx
<ChatKitWrapper
  agentType="venue_event"
  venueId={venueId}
  eventId={eventId}
  title="Event Manager"
  className="h-[600px]"
/>
```

**Example interaction:**
```
Venue: "Has the florist confirmed?"
Agent: "Yes! Rose Garden Florist confirmed on Oct 3rd. They'll deliver
       at 2pm on the event day. Cost: $1,250 (approved by client)."
```

---

## Implementation Details

### Frontend: ChatKitWrapper Component

**Location:** [components/chat/ChatKitWrapper.tsx](../components/chat/ChatKitWrapper.tsx)

**Key features:**
- Loads ChatKit library from OpenAI CDN
- Configures custom backend endpoint (`/api/chatkit`)
- Injects metadata (agent type, user IDs) into all requests
- Provides theme customization
- Includes agent-specific starter prompts
- Handles user authentication

**Component props:**
```tsx
interface ChatKitWrapperProps {
  agentType: 'client' | 'venue_general' | 'venue_event';
  eventId?: string;        // Required for client and venue_event
  venueId?: string;        // Required for venue agents
  title?: string;          // Chat header title
  subtitle?: string;       // Chat header subtitle
  className?: string;      // Styling
}
```

**Theme customization:**
```tsx
theme: {
  colorScheme: 'light',
  radius: 'round',
  color: {
    accent: {
      primary: '#f0bda4',  // Brand color
      level: 1,
    },
  },
}
```

---

### Backend: ChatKit Protocol Handler

**Location:** [app/api/chatkit/route.ts](../app/api/chatkit/route.ts)

**Implements ChatKit protocol operations:**
- `threads.create` - Create new thread and process first message
- `threads.list` - List user's conversation threads
- `threads.get` - Retrieve thread with full message history
- `threads.update` - Update thread metadata (title, etc.)
- `threads.delete` - Delete conversation thread

**Request flow:**
1. Authenticate user via Supabase
2. Parse request type and parameters
3. Extract metadata (agentType, eventId, venueId)
4. Create appropriate agent using Agents SDK
5. Execute agent with user message
6. Stream response via Server-Sent Events (SSE)
7. Store conversation in Supabase

**Response format (SSE):**
```
data: {"type":"thread.created","thread":{...}}

data: {"type":"thread.item.added","item":{...}}  // User message

data: {"type":"thread.item.added","item":{...}}  // Agent response

data: {"type":"done"}
```

---

### Storage: ChatKitStore

**Location:** [lib/chatkit/store.ts](../lib/chatkit/store.ts)

**Manages thread persistence in Supabase:**

**Database tables:**
- `chatkit_threads` - Thread metadata and configuration
- `chatkit_thread_items` - Individual messages within threads

**Key methods:**
- `createThread(metadata)` - Create new thread with agent configuration
- `loadThread(threadId)` - Load thread metadata
- `listThreads(userId, options)` - List user's threads with pagination
- `updateThread(threadId, updates)` - Update thread metadata
- `deleteThread(threadId)` - Soft delete thread
- `addThreadItem(threadId, item)` - Add message to thread
- `loadThreadItems(threadId)` - Load all messages in thread

**Thread metadata structure:**
```typescript
{
  user_id: string;
  user_type: 'client' | 'venue' | 'vendor';
  agent_type: 'client' | 'venue_general' | 'venue_event';
  event_id?: string;
  venue_id?: string;
  // ... additional custom metadata
}
```

---

### Agents: OpenAI Agents SDK

**Location:** [lib/agents/agentSDK.ts](../lib/agents/agentSDK.ts)

**Agent factory functions:**
```typescript
// Create client-facing agent
createClientAgent(clientId: string, eventId: string)

// Create venue general operations agent
createVenueGeneralAgent(venueId: string)

// Create event-specific venue agent
createVenueEventAgent(venueId: string, eventId: string)
```

**Each agent is composed of:**
1. **System prompt** - Role definition and behavior guidelines
   - Location: [lib/agents/prompts.ts](../lib/agents/prompts.ts)

2. **Context** - Relevant data for the conversation
   - Location: [lib/agents/context.ts](../lib/agents/context.ts)

3. **Tools** - Available actions the agent can take
   - Location: [lib/agents/tools.ts](../lib/agents/tools.ts)

4. **Tool handlers** - Business logic implementations
   - Location: [lib/agents/toolHandlers.ts](../lib/agents/toolHandlers.ts)

**Agent configuration:**
- Model: `gpt-4o` (OpenAI's most capable model)
- Temperature: Configured per agent type
- Max tokens: Configured based on expected response length

---

## Setup & Configuration

### Environment Variables

Add to `.env.local`:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-proj-your_key_here

# ChatKit Domain Key (required)
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=domain_pk_localhost_dev  # For local dev

# Supabase (required for thread storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### Domain Registration

ChatKit requires domain allowlisting for security.

**For local development:**
- Already configured: Domain `localhost` with key `domain_pk_localhost_dev`
- No action needed for local testing

**For production:**
1. Visit: https://platform.openai.com/settings/organization/security/domain-allowlist
2. Click "Add Domain"
3. Enter your production domain (e.g., `yourapp.vercel.app`)
4. Copy the generated domain key
5. Set as environment variable:
   ```bash
   NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=domain_pk_your_production_key
   ```
6. Deploy with updated environment variable

**Important:** Different keys for different environments (localhost, staging, production)

---

### Database Migration

Run the ChatKit migration to create required tables:

**Migration file:** `supabase/migrations/20250120000000_chatkit_schema.sql`

**Tables created:**
```sql
-- Conversation threads
chatkit_threads (
  thread_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  metadata jsonb,
  title text,
  created_at timestamptz,
  updated_at timestamptz
)

-- Messages within threads
chatkit_thread_items (
  item_id uuid PRIMARY KEY,
  thread_id uuid REFERENCES chatkit_threads,
  item_type text,
  role text,
  content jsonb,
  status text,
  metadata jsonb,
  created_at timestamptz
)
```

**Apply migration:**
```bash
# Local development
npx supabase migration up

# Production
npx supabase db push
```

---

## Usage Examples

### Client Event Page

```tsx
import { ChatKitWrapper } from '@/components/chat/ChatKitWrapper';

export default function ClientEventPage({
  params
}: {
  params: { eventId: string }
}) {
  const { data: user } = useUser();

  return (
    <div className="h-screen flex">
      {/* Left: Event details */}
      <div className="w-1/2 p-6">
        <EventDetails eventId={params.eventId} />
      </div>

      {/* Right: AI Assistant */}
      <div className="w-1/2 border-l">
        <ChatKitWrapper
          agentType="client"
          eventId={params.eventId}
          title="Your Event Assistant"
          subtitle="I'm here to help plan your perfect event"
          className="h-full"
        />
      </div>
    </div>
  );
}
```

---

### Venue Event Page

```tsx
export default function VenueEventPage({
  params
}: {
  params: { venueId: string; eventId: string }
}) {
  return (
    <div className="h-screen">
      {/* Main content area with tabs */}
      <div className="h-full flex flex-col">
        <EventHeader eventId={params.eventId} />

        <div className="flex-1 flex">
          {/* Left: Event management UI */}
          <div className="w-2/3 p-6">
            <EventManagementTabs eventId={params.eventId} />
          </div>

          {/* Right: AI Assistant */}
          <div className="w-1/3 border-l">
            <ChatKitWrapper
              agentType="venue_event"
              venueId={params.venueId}
              eventId={params.eventId}
              title="Event Manager"
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Venue Dashboard

```tsx
export default function VenueDashboard({
  params
}: {
  params: { venueId: string }
}) {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard widgets */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <UpcomingEvents venueId={params.venueId} />
          <PendingTasks venueId={params.venueId} />
          <RecentMessages venueId={params.venueId} />
        </div>

        {/* AI Assistant */}
        <div className="bg-white rounded-lg shadow">
          <ChatKitWrapper
            agentType="venue_general"
            venueId={params.venueId}
            title="Venue Assistant"
            subtitle="Ask me about your events, tasks, or operations"
            className="h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Customization

### Starter Prompts

Edit starter prompts in [components/chat/ChatKitWrapper.tsx](../components/chat/ChatKitWrapper.tsx):

```tsx
function getStarterPrompts(agentType: string) {
  switch (agentType) {
    case 'client':
      return [
        'Show me my event details',
        'What are my next steps?',
        'Help me customize the catering',
        'Add guests to my event',
      ];

    case 'venue_general':
      return [
        'What events do I have this week?',
        'Show me tasks needing attention',
        'List my pending vendor approvals',
      ];

    case 'venue_event':
      return [
        'What\'s the current event status?',
        'Has the client approved all elements?',
        'Send a reminder to the photographer',
      ];

    default:
      return [];
  }
}
```

---

### Agent Behavior

Modify agent system prompts in [lib/agents/prompts.ts](../lib/agents/prompts.ts):

```tsx
export function generateClientSystemPrompt(context: ClientContext) {
  return `You are a helpful, enthusiastic event planning assistant...

Current event details:
- Date: ${context.event.date}
- Venue: ${context.venue.name}
- Guest count: ${context.event.guest_count}
...`;
}
```

**Customization options:**
- Tone and personality
- Response length preferences
- Proactivity level
- Formality level
- Industry-specific terminology

---

### Available Tools

Add or modify agent capabilities in [lib/agents/tools.ts](../lib/agents/tools.ts):

```typescript
export const clientTools = [
  {
    type: 'function',
    function: {
      name: 'getEventDetails',
      description: 'Retrieve full details about the client\'s event',
      parameters: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID'
          }
        },
        required: ['eventId']
      }
    }
  },
  // ... more tools
];
```

Implement tool logic in [lib/agents/toolHandlers.ts](../lib/agents/toolHandlers.ts):

```typescript
export const clientToolHandlers = {
  async getEventDetails(params: { eventId: string }, context: ToolContext) {
    const event = await getEvent(params.eventId);
    return {
      success: true,
      event
    };
  },
  // ... more handlers
};
```

---

## Troubleshooting

### Chat Interface Not Loading

**Symptoms:** Blank chat area, no UI appears

**Possible causes:**
1. ChatKit script not loading from CDN
2. Domain key not configured
3. JavaScript errors in console

**Steps to fix:**
1. Open browser DevTools console
2. Look for errors related to ChatKit
3. Check Network tab for failed CDN requests
4. Verify `NEXT_PUBLIC_CHATKIT_DOMAIN_KEY` is set
5. Ensure ChatKit script URL is accessible

---

### "Domain Not Allowed" Error

**Symptoms:** Error message: "This domain is not allowed"

**Cause:** Domain not registered in OpenAI allowlist

**Fix:**
1. For localhost: Ensure using `domain_pk_localhost_dev`
2. For production: Register domain at OpenAI allowlist
3. Verify environment variable matches registered domain
4. Restart dev server after changing env vars
5. Clear browser cache if issue persists

---

### Agent Not Responding

**Symptoms:** Messages send but no response appears

**Possible causes:**
1. OpenAI API key invalid or missing
2. Agent creation failing
3. Required metadata missing
4. Tool execution errors

**Steps to diagnose:**
1. Check server terminal for `[ChatKit]` errors
2. Verify `OPENAI_API_KEY` is set and valid
3. Ensure required metadata is provided:
   - Client: needs `eventId`
   - Venue General: needs `venueId`
   - Venue Event: needs both `venueId` and `eventId`
4. Check OpenAI API usage dashboard for errors
5. Verify user has access to the event/venue

---

### "Unauthorized" Errors

**Symptoms:** 401 errors when attempting to send messages

**Cause:** User not authenticated

**Fix:**
1. Ensure user is logged in via Supabase Auth
2. Check session is valid: `supabase.auth.getSession()`
3. Verify authentication middleware is working
4. Clear browser cookies and re-login
5. Check Supabase Auth logs for issues

---

### Slow Response Times

**Symptoms:** Long delays before agent responds

**Possible causes:**
1. Large context being sent to agent
2. Slow database queries
3. Complex tool executions
4. OpenAI API rate limiting

**Optimizations:**
1. Review context builders - reduce unnecessary data
2. Add database indexes to frequently queried tables
3. Cache expensive operations (Redis)
4. Profile tool execution times
5. Consider upgrading OpenAI API tier for higher rate limits

---

### Messages Not Persisting

**Symptoms:** Conversation lost after refresh

**Possible causes:**
1. Migration not applied
2. Supabase connection issues
3. Store methods failing silently

**Fix:**
1. Verify migration applied: Check `chatkit_threads` table exists
2. Test Supabase connection: Run queries in SQL editor
3. Check server logs for storage errors
4. Verify RLS policies allow user to read/write threads

---

## Production Deployment

### Pre-Deployment Checklist

**Required:**
- [ ] Register production domain at OpenAI allowlist
- [ ] Set `NEXT_PUBLIC_CHATKIT_DOMAIN_KEY` in production environment
- [ ] Apply ChatKit migration to production database
- [ ] Set `OPENAI_API_KEY` in production environment
- [ ] Configure Supabase production credentials
- [ ] Test all three agent types in staging environment

**Recommended:**
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Add rate limiting to `/api/chatkit` endpoint
- [ ] Implement usage tracking and analytics
- [ ] Configure alerting for high error rates
- [ ] Test with realistic data volumes
- [ ] Prepare runbook for common issues
- [ ] Document agent behavior for support team

---

### Monitoring

**Key metrics to track:**
1. **Request volume** - Messages per minute/hour
2. **Response times** - Agent response latency
3. **Error rates** - Failed requests percentage
4. **Token usage** - OpenAI API token consumption
5. **Thread creation** - New conversations per day
6. **User engagement** - Messages per session

**Alerts to configure:**
- Error rate > 5%
- Average response time > 10 seconds
- OpenAI API failures
- Database connection issues
- Unusual spike in token usage

---

### Scaling Considerations

**Current limits:**
- Vercel function timeout: 60 seconds (maxDuration)
- OpenAI API rate limits: Based on tier
- Supabase connections: Based on plan
- Database storage: Thread and message accumulation

**If scaling issues arise:**

1. **Long-running operations:**
   - Move to background jobs (queue system)
   - Implement async task processing
   - Stream partial responses

2. **High token usage:**
   - Optimize context building
   - Reduce unnecessary tool calls
   - Implement caching layer

3. **Database performance:**
   - Add indexes to frequent queries
   - Implement connection pooling
   - Consider read replicas

4. **API rate limits:**
   - Implement request queuing
   - Upgrade OpenAI tier
   - Add retry logic with exponential backoff

---

## Resources

### Official Documentation
- **ChatKit JS:** https://openai.github.io/chatkit-js/
- **Custom Backends:** https://openai.github.io/chatkit-js/guides/custom-backends/
- **Agents SDK:** https://github.com/openai/openai-agents-js
- **Domain Allowlist:** https://platform.openai.com/settings/organization/security/domain-allowlist

### Internal Documentation
- [AI Agents Overview](./ai-agents.md) - Detailed agent architecture
- [Database Schema](./schema.md) - Database structure
- [Tool Creation Guidelines](./ai-agents.md#tool-creation-guidelines) - Building agent tools

---

## Future Enhancements

**Potential features to add:**

**User Experience:**
- File uploads (images, documents, PDFs)
- Voice messages (audio input/output)
- Message reactions (emoji reactions)
- Thread titles (auto-generated from conversation)
- Message search (full-text search across threads)

**Agent Capabilities:**
- Custom widgets (embed interactive UI in messages)
- Client-side actions (JavaScript triggered from chat)
- Scheduled messages (send at specific time)
- Multi-language support (non-English conversations)
- Sentiment analysis (detect client satisfaction)

**Platform Integration:**
- SMS notifications for urgent messages
- Email summaries of conversations
- Slack/Teams integration for venue staff
- Export conversation history
- Analytics dashboard for agent performance

**Advanced Features:**
- Multi-agent collaboration (agents consulting each other)
- Handoff to human support
- Conversation branching (explore alternatives)
- Proactive suggestions (agent initiates based on context)
