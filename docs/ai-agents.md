**Making Suggestions:**
```
Client: We need catering but not sure what to do# AI Agents & LLM Orchestration

## Overview

This platform uses multiple AI agents coordinated by a central orchestrator. Each agent has specific context and capabilities, but the orchestrator manages the overall workflow.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Orchestrator Agent                  │
│          (LangGraph State Management)               │
│                                                     │
│  - Monitors all conversations                      │
│  - Creates tasks dynamically                       │
│  - Routes information                              │
│  - Manages approvals                               │
│  - Sends notifications                             │
└──────────────┬─────────────┬────────────┬──────────┘
               │             │            │
       ┌───────▼─────┐ ┌─────▼─────┐ ┌──▼──────────┐
       │   Client    │ │   Venue   │ │   Vendor    │
       │  Assistant  │ │ Assistant │ │  Interface  │
       │             │ │           │ │  (limited)  │
       └─────────────┘ └───────────┘ └─────────────┘
```

## LangGraph State Management

### Event State Graph

Each event has an associated state graph that tracks:

```typescript
interface EventState {
  event_id: string;
  status: EventStatus;
  elements: ElementState[];
  tasks: TaskState[];
  pending_approvals: Approval[];
  conversation_contexts: {
    client: ConversationContext;
    venue: ConversationContext;
  };
  action_history: Action[];
  metadata: any;
}

interface ElementState {
  element_id: string;
  status: "proposed" | "client_approved" | "venue_confirmed" | "vendor_confirmed" | "finalized" | "needs_revision";
  approval_chain: string[]; // Who needs to approve
  current_approver?: string;
}

interface TaskState {
  task_id: string;
  status: TaskStatus;
  assigned_to: string;
  created_at: datetime;
  due_date?: datetime;
  dependencies: string[]; // Other task IDs
}

interface Approval {
  approval_id: string;
  type: "element" | "change_request" | "contract" | "payment";
  target_id: string;
  pending_from: string[]; // User IDs who need to approve
  approved_by: string[];
  status: "pending" | "approved" | "rejected";
}
```

### State Transitions

```typescript
// Example state transitions
const eventWorkflow = {
  inquiry: {
    transitions: ["venue_review"],
    actions: ["create_initial_tasks", "notify_venue"]
  },
  venue_review: {
    transitions: ["pending_confirmation", "rejected"],
    actions: ["send_confirmation_email"]
  },
  pending_confirmation: {
    transitions: ["confirmed", "expired"],
    actions: ["send_reminder_at_24h"]
  },
  confirmed: {
    transitions: ["in_planning"],
    actions: ["create_planning_tasks", "invoke_element_suggestion"]
  },
  in_planning: {
    transitions: ["finalized", "cancelled"],
    actions: ["monitor_progress", "create_dynamic_tasks"]
  },
  finalized: {
    transitions: ["completed"],
    actions: ["final_confirmations", "send_reminders"]
  }
};
```

## Orchestrator Agent

### Primary Responsibilities

**1. Context Management**
```typescript
interface OrchestratorContext {
  all_events: Event[];
  active_conversations: Conversation[];
  pending_tasks: Task[];
  recent_actions: Action[];
  user_preferences: UserPreferences;
}
```

The orchestrator maintains a holistic view of:
- All ongoing events
- Conversations across all parties
- Pending tasks and deadlines
- Recent actions and changes
- User preferences and patterns

**2. Dynamic Task Creation**

```typescript
interface TaskCreationDecision {
  trigger: "conversation" | "action" | "time_based" | "dependency";
  context: any;
  decision: {
    create_task: boolean;
    task_type: string;
    assigned_to: string;
    priority: Priority;
    form_schema?: FormSchema;
    due_date?: datetime;
  };
}
```

The orchestrator analyzes conversations and determines when to create tasks:

**Example Scenarios:**

*Scenario 1: Client requests change*
```
Client: "Can we change the flowers to be more pink and less red?"

Orchestrator analyzes:
- This affects the floral element
- Floral element has external vendor
- Change requires vendor approval
- Creates task for vendor with form

Task created:
- Type: "element_change_request"
- Assigned to: Floral vendor
- Form: Custom form with color preferences, budget impact
- Priority: Medium
- Due: 3 days before event
```

*Scenario 2: Venue notices issue*
```
Venue (to AI): "The kitchen renovation will limit catering capacity for events in June"

Orchestrator analyzes:
- Affects multiple June events
- Creates tasks for venue to contact affected clients
- Creates alert for future bookings
- Updates capacity rules

Tasks created:
- Multiple client notification tasks
- Venue review task for alternatives
- System update task for capacity rules
```

**3. Information Routing**

The orchestrator determines:
- What information each party needs
- When to share information
- How to present information (message vs task vs notification)
- Whether to request additional details

**4. Approval Chain Management**

```typescript
interface ApprovalChain {
  initiator: string;
  approvers: ApprovalStep[];
  current_step: number;
  status: "pending" | "approved" | "rejected";
}

interface ApprovalStep {
  approver_id: string;
  approver_type: "client" | "venue" | "vendor";
  required: boolean; // vs optional
  status: "pending" | "approved" | "rejected" | "skipped";
  approved_at?: datetime;
  conditions?: any; // When does this step apply?
}
```

**Example Approval Flow:**
```
Client requests custom catering menu
→ Venue reviews and approves concept
→ Caterer reviews and provides pricing
→ Client approves pricing
→ Venue confirms contract terms
→ Finalized
```

**5. Notification Management**

```typescript
interface NotificationDecision {
  event: string;
  urgency: "low" | "medium" | "high" | "critical";
  recipients: string[];
  channels: ("in_app" | "email" | "sms")[];
  timing: "immediate" | "batch" | "scheduled";
  content: {
    subject: string;
    body: string;
    cta?: CallToAction;
  };
}
```

**Notification Rules:**
- Critical: Immediate email + in-app (payment failures, cancellations)
- High: Immediate in-app, email within 15 min (approvals needed, deadlines approaching)
- Medium: In-app, batch email daily (updates, non-urgent tasks)
- Low: In-app only (status changes, informational)

User preferences can override defaults.

---

## Dynamic Form Generation

### Form Schema

The orchestrator can generate custom forms for complex tasks:

```typescript
interface FormSchema {
  form_id: string;
  task_id: string;
  title: string;
  description: string;
  fields: FormField[];
  validation: ValidationRules;
  submit_action: string; // Tool to call with form data
}

interface FormField {
  id: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | 
        "date" | "datetime" | "file" | "checkbox" | "radio" | 
        "color-picker" | "slider" | "rating";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: Option[]; // For select/multiselect/radio
  validation?: FieldValidation;
  conditional?: ConditionalLogic; // Show/hide based on other fields
  helpText?: string;
}

interface Option {
  value: string;
  label: string;
  description?: string;
  image?: string;
}
```

### Example: Custom Floral Arrangement Form

```typescript
{
  form_id: "floral_customization_123",
  task_id: "task_456",
  title: "Customize Floral Arrangements",
  description: "Please specify your preferences for the floral arrangements",
  fields: [
    {
      id: "color_scheme",
      type: "multiselect",
      label: "Color Scheme",
      required: true,
      options: [
        { value: "pink", label: "Pink", image: "/colors/pink.png" },
        { value: "white", label: "White", image: "/colors/white.png" },
        { value: "blush", label: "Blush", image: "/colors/blush.png" }
      ]
    },
    {
      id: "flower_types",
      type: "multiselect",
      label: "Preferred Flowers",
      required: false,
      options: [
        { value: "roses", label: "Roses" },
        { value: "peonies", label: "Peonies" },
        { value: "hydrangeas", label: "Hydrangeas" }
      ],
      helpText: "Select your favorite flowers, or leave blank for florist's choice"
    },
    {
      id: "style",
      type: "select",
      label: "Arrangement Style",
      required: true,
      options: [
        { value: "romantic", label: "Romantic & Lush" },
        { value: "modern", label: "Modern & Minimalist" },
        { value: "rustic", label: "Rustic & Natural" }
      ]
    },
    {
      id: "budget_impact",
      type: "radio",
      label: "Are you willing to adjust budget if needed?",
      required: true,
      options: [
        { value: "flexible", label: "Yes, within reason" },
        { value: "strict", label: "No, must stay within original budget" }
      ]
    },
    {
      id: "additional_notes",
      type: "textarea",
      label: "Additional Notes",
      required: false,
      placeholder: "Any other specific requests or preferences?"
    }
  ],
  submit_action: "submit_floral_customization"
}
```

### Form Rendering

The frontend receives this schema and dynamically renders the form with:
- Proper validation
- Conditional logic
- File uploads
- Rich interactions (color pickers, date pickers, etc.)

### Form Submission Flow

```
1. User fills out form
2. Frontend validates client-side
3. Submit to backend
4. Backend validates with Zod
5. Orchestrator receives form data
6. Orchestrator analyzes response
7. Orchestrator decides next actions:
   - Create follow-up tasks?
   - Send messages?
   - Update element status?
   - Request additional approvals?
8. Parties notified of outcome
```

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