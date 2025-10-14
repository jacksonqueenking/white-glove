# ChatKit and AI Agents Setup

This document describes how the ChatKit integration works and how to set it up.

## Overview

We've integrated OpenAI's ChatKit for the chat interfaces, replacing the custom chat components with ChatKit's plug-and-play UI. The system uses three types of AI agents:

1. **Client Agent** - Helps clients plan their events
2. **Venue Event Agent** - Manages a specific event for venue staff
3. **Venue General Agent** - Handles venue-wide operations

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (Next.js)                  │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐│
│  │ Client Chat  │  │ Venue Event  │  │  Venue    ││
│  │              │  │     Chat     │  │ General   ││
│  │  ChatKit UI  │  │  ChatKit UI  │  │   Chat    ││
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘│
│         │                  │                 │      │
└─────────┼──────────────────┼─────────────────┼──────┘
          │                  │                 │
          └──────────────────┴─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Session API     │
                    │  /api/chatkit/   │
                    │   session        │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
    ┌─────▼──────┐                    ┌────────▼────────┐
    │  OpenAI    │                    │  Agent Context  │
    │  ChatKit   │◄───────────────────┤    Builders     │
    │  Sessions  │                    │                 │
    └────────────┘                    │  - prompts.ts   │
                                      │  - tools.ts     │
                                      │  - context.ts   │
                                      │  - toolHandlers │
                                      └─────────────────┘
```

## Components

### 1. ChatKit Wrapper Components

**Location:** `components/chat/`

- `ChatKitWrapper.tsx` - Base wrapper that handles session management
- `ClientEventChat.tsx` - Client-specific chat interface
- `VenueEventChat.tsx` - Venue event-specific chat interface
- `VenueGeneralChat.tsx` - Venue-wide chat interface

### 2. Session Management

**Location:** `app/api/chatkit/session/route.ts`

The session API creates short-lived client tokens for ChatKit:

```typescript
POST /api/chatkit/session?agentType=client&eventId=xxx
```

Query parameters:
- `agentType`: 'client' | 'venue_general' | 'venue_event'
- `eventId`: Required for client and venue_event agents
- `venueId`: Required for venue agents

### 3. Agent System

**Location:** `lib/agents/`

#### Agent Prompts (`prompts.ts`)
Generates context-rich system prompts for each agent type with:
- Current event/venue details
- Tasks and their status
- Guest lists and RSVPs
- Element selections
- Recent action history
- Available offerings

#### Agent Tools (`tools.ts`)
OpenAI-compatible tool definitions:
- **Client Tools** (10 tools): Element management, guest management, tasks, messaging
- **Venue General Tools** (10 tools): Event listing, vendor management, offerings management
- **Venue Event Tools** (14 tools): Full event management, elements, guests, tasks, coordination

#### Tool Handlers (`toolHandlers.ts`)
Implementations that execute tool calls:
- Validates inputs with Zod schemas
- Checks permissions
- Calls database functions
- Handles errors
- Logs actions

#### Context Builders (`context.ts`)
Functions that fetch all necessary data for each agent:
- `buildClientContext(clientId, eventId)`
- `buildVenueGeneralContext(venueId)`
- `buildVenueEventContext(venueId, eventId)`

#### Agents SDK Integration (`agentSDK.ts`)
Connects everything using OpenAI's Agents SDK:
- `createClientAgent(clientId, eventId)`
- `createVenueGeneralAgent(venueId)`
- `createVenueEventAgent(venueId, eventId)`

## Setup Instructions

### 1. Environment Variables

Add to your `.env.local`:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Agent Builder Workflow IDs (optional - for production)
# These are created in OpenAI's Agent Builder interface
OPENAI_WORKFLOW_ID_CLIENT=workflow_...
OPENAI_WORKFLOW_ID_VENUE_GENERAL=workflow_...
OPENAI_WORKFLOW_ID_VENUE_EVENT=workflow_...
```

### 2. Dependencies

Already installed:
```bash
npm install @openai/chatkit-react @openai/agents zod@3
```

### 3. ChatKit Script

The ChatKit JavaScript is loaded automatically in the `ChatKitWrapper` component via:
```html
<script src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js" async />
```

### 4. Agent Builder Workflows (Optional)

For production, you can create workflows in OpenAI's Agent Builder:

1. Go to [platform.openai.com/agent-builder](https://platform.openai.com/agent-builder)
2. Create a new workflow for each agent type
3. Configure:
   - **Start node**: Accept user input
   - **Agent node**: Configure with your system prompts and tools
   - **End node**: Return agent output
4. Publish and get the workflow ID
5. Add to environment variables

**Note:** The session API includes a fallback for development that works without workflows.

## Usage

### In Event Pages

The `AppShell` component automatically renders the appropriate chat interface based on:
- The `mode` prop ('client' | 'venue' | 'vendor')
- The current user type (from authentication)
- The current route (to get eventId)

### Client Event Page
```tsx
// app/client/event/[eventId]/page.tsx
// AppShell automatically shows ClientEventChat when:
// - mode="client"
// - user is authenticated as client
// - eventId is in URL params
```

### Venue Event Page
```tsx
// app/venue/events/[eventId]/page.tsx
// AppShell automatically shows VenueEventChat when:
// - mode="venue"
// - user is authenticated as venue
// - eventId is in URL params
```

### Venue Dashboard
```tsx
// app/venue/dashboard/page.tsx
// AppShell automatically shows VenueGeneralChat when:
// - mode="venue"
// - user is authenticated as venue
// - NO eventId in URL params
```

## Customization

### Theme

Customize ChatKit's appearance in `ChatKitWrapper.tsx`:

```typescript
theme: {
  colors: {
    primary: '#f0bda4',
    secondary: '#f8f4ec',
    text: '#3f3a33',
    background: '#f8f4ec',
    border: '#e7dfd4',
  },
}
```

### Start Screen

Customize the initial greeting:

```typescript
startScreen: {
  title: 'Custom Title',
  subtitle: 'Custom subtitle text',
}
```

## Adding New Tools

To add a new tool to an agent:

1. **Define the tool** in `lib/agents/tools.ts`:
```typescript
{
  type: 'function',
  function: {
    name: 'my_new_tool',
    description: 'What this tool does',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'Description' },
      },
      required: ['param1'],
    },
  },
}
```

2. **Implement the handler** in `lib/agents/toolHandlers.ts`:
```typescript
async my_new_tool(params, context) {
  const { param1 } = z.object({ param1: z.string() }).parse(params);

  // Permission check
  // Business logic
  // Database operations

  return result;
}
```

3. **Add to the appropriate tools array** in `lib/agents/tools.ts`:
```typescript
export const clientTools: OpenAITool[] = [
  // ... existing tools
  myNewTool,
];
```

The tool will automatically be available to the agent through the Agents SDK integration.

## Monitoring and Debugging

### Chat Sessions

Monitor chat sessions in the OpenAI dashboard:
- View conversation histories
- See tool calls and results
- Debug errors

### Tool Execution

Tool execution is logged in the server console:
- Tool name
- Parameters
- Success/failure
- Error messages

### Context Building

Check the generated prompts by logging in `lib/agents/prompts.ts`:
```typescript
console.log('Client system prompt:', prompt);
```

## Migration from Old Chat Components

The following components have been replaced:

- ❌ `components/chat/ChatWindow.tsx` (old custom UI)
- ❌ `components/chat/BaseChatWindow.tsx` (old custom UI)
- ❌ `components/venue/VenueChatWindow.tsx` (old custom UI)

Now using:
- ✅ `components/chat/ClientEventChat.tsx` (ChatKit)
- ✅ `components/chat/VenueEventChat.tsx` (ChatKit)
- ✅ `components/chat/VenueGeneralChat.tsx` (ChatKit)

The old components can be safely removed once you verify ChatKit is working correctly.

## Troubleshooting

### "Failed to create session" error

1. Check `OPENAI_API_KEY` is set correctly
2. Verify user is authenticated
3. Check console for specific error messages
4. For workflow errors, ensure workflow IDs are correct or remove them to use fallback

### Chat not loading

1. Verify ChatKit script is loading (check Network tab)
2. Check browser console for JavaScript errors
3. Ensure `useCurrentUser` hook is returning user data
4. Verify API route is responding (check Network tab for /api/chatkit/session)

### Tools not working

1. Check tool handler permissions
2. Verify database functions are accessible
3. Check server console for tool execution errors
4. Ensure Zod validation schemas match tool parameters

### Context not updating

1. Verify context builders are fetching latest data
2. Check if system prompts include current information
3. Refresh the chat session (reload page)
4. Check that real-time subscriptions are working

## Next Steps

1. **Test the Integration**: Visit event pages and try the chat interfaces
2. **Configure Workflows**: Create Agent Builder workflows for production
3. **Remove Old Components**: Delete old chat components once verified
4. **Add Monitoring**: Set up logging and analytics
5. **Optimize Performance**: Add caching for context building
6. **Enhance UX**: Customize ChatKit theme and start screens
