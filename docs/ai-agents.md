# AI Agents & LLM Orchestration

## Overview

This platform uses **OpenAI Agents SDK** to power specialized AI agents for different user types. Each agent has specific context, capabilities, and tools tailored to their role in event coordination.

## Architecture

```
┌──────────────────────────────────────────────┐
│              ChatKit UI Layer                │
│        (Production chat interface)           │
└────────────────────┬─────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │  Custom Backend API    │
         │   (/api/chatkit)       │
         └───────────┬────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
┌─────▼─────┐  ┌────▼────┐  ┌──────▼───────┐
│  Client   │  │  Venue  │  │   Venue      │
│  Agent    │  │ General │  │   Event      │
│           │  │  Agent  │  │   Agent      │
└─────┬─────┘  └────┬────┘  └──────┬───────┘
      │             │              │
      └─────────────┼──────────────┘
                    │
           ┌────────▼────────┐
           │  Tool Handlers  │
           │  - Database ops │
           │  - Messaging    │
           │  - Tasks        │
           └─────────────────┘
```

## Three Specialized Agents

### 1. Client Agent

**Purpose:** Help clients plan their events through conversational AI

**Implementation:** `lib/agents/clientAssistant.ts`

**Context provided:**
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

**Example interaction:**
```
Client: "Can we add more vegetarian options to the menu?"

Agent: "I can help with that! Your current menu has one vegetarian
option. Let me check with the caterer about additional options.
What type of cuisine are you interested in?"
```

---

### 2. Venue General Agent

**Purpose:** Help venue staff manage operations across all events

**Implementation:** `lib/agents/venueAssistant.ts`

**Context provided:**
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

**Example interaction:**
```
Venue: "What events do I have this weekend?"

Agent: "You have 3 events this weekend:
- Smith Wedding (Sat, 6pm) - All confirmed
- Johnson Birthday (Sat, 2pm) - Awaiting final guest count
- Martinez Corporate (Sun, 11am) - 2 pending vendor confirmations"
```

---

### 3. Venue Event Agent

**Purpose:** Help venue staff coordinate a specific event

**Implementation:** `lib/agents/venueAssistant.ts` (event context)

**Context provided:**
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

**Example interaction:**
```
Venue: "Has the florist confirmed for the Smith wedding?"

Agent: "Yes! Rose Garden Florist confirmed on Oct 3rd. They'll
deliver at 2pm on the event day. Cost: $1,250 (approved by client)."
```

---

## Agent Capabilities

### What Agents Can Do

1. **Answer Questions** - Using provided context
2. **Execute Actions** - Via tool calling
3. **Create Tasks** - For other users when coordination needed
4. **Send Messages** - Between parties
5. **Manage Data** - Update events, elements, guests
6. **Make Decisions** - Within defined boundaries

### What Agents Cannot Do

- Access data outside their context
- Bypass RLS policies
- Make financial transactions directly
- Delete or permanently modify critical data
- Impersonate other users

---

## Tool Creation Guidelines

All functions that can be called by AI agents must follow these standards:

### Function Signature

```typescript
/**
 * Brief description of what this tool does
 * 
 * @param {Object} params - The parameters object
 * @param {string} params.event_id - ID of the event
 * @param {string} params.element_id - ID of the element to update
 * @param {string} params.new_status - New status for the element
 * @param {string} [params.notes] - Optional notes about the change
 * @returns {Promise<UpdateResult>} Result of the update operation
 * @throws {ValidationError} If parameters are invalid
 * @throws {PermissionError} If user lacks permission
 */
async function updateElementStatus(params: {
  event_id: string;
  element_id: string;
  new_status: ElementStatus;
  notes?: string;
}): Promise<UpdateResult> {
  // Implementation
}
```

### Zod Validation Schema

```typescript
const UpdateElementStatusSchema = z.object({
  event_id: z.string().uuid(),
  element_id: z.string().uuid(),
  new_status: z.enum(["to-do", "in_progress", "completed", "needs_attention"]),
  notes: z.string().optional()
});
```

### Tool Registration

```typescript
const tools = {
  update_element_status: {
    name: "update_element_status",
    description: "Update the status of an event element",
    parameters: UpdateElementStatusSchema,
    function: updateElementStatus,
    requiresApproval: false, // Some tools need human approval
    permissions: ["venue", "admin"], // Who can call this
    auditLog: true // Log all calls
  }
};
```

### Error Handling

```typescript
async function updateElementStatus(params) {
  try {
    // Validate input
    const validated = UpdateElementStatusSchema.parse(params);
    
    // Check permissions
    if (!hasPermission(validated.event_id, "update_element")) {
      throw new PermissionError("User cannot update this element");
    }
    
    // Perform update
    const result = await db.elements.update(/* ... */);
    
    // Audit log
    await logAction({
      type: "element_status_updated",
      user: currentUser,
      event_id: validated.event_id,
      details: validated
    });
    
    // Trigger side effects (notifications, etc.)
    await orchestrator.notify("element_updated", result);
    
    return {
      success: true,
      element: result
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid parameters", error.errors);
    }
    throw error;
  }
}
```

---

## Client AI Assistant

### Context

```typescript
interface ClientAssistantContext {
  client: Client;
  event: Event;
  venue: Venue;
  available_elements: Element[];
  conversation_history: Message[];
  memories: Memory[]; // Past preferences, decisions
}
```

### Personality & Behavior

- Friendly and enthusiastic
- Proactive in suggestions
- Patient with changes/indecision
- Budget-conscious
- Clarifies ambiguity before taking action
- Confirms major decisions
- Celebrates milestones

### Example Interactions

**Greeting:**
```
Assistant: Hi! I'm excited to help you plan your wedding at The Grand Ballroom! 
I see you're looking at a June 15th date for about 150 guests. 
What aspects of your event would you like to start planning first?
```

**Making Suggestions:**
```
Client: We need catering but not sure what to do