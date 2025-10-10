# Tasks and Workflows Documentation

## Overview

The task system is intentionally simple and flexible. The AI orchestrator creates and manages tasks dynamically based on context, using tools to generate appropriate tasks when needed. This document describes the basic task structure, available tools, and principles for the orchestrator.

---

## Core Concept

**Tasks are created by the AI orchestrator when it determines action is needed.**

There are no hardcoded task types or rigid workflows. Instead:
- The orchestrator monitors conversations and events
- When it sees something requiring user input or approval, it creates a task
- Tasks can include dynamically-generated forms
- The orchestrator processes task responses and decides next steps

---

## Task Structure

### Basic Task Fields

```
Task:
- task_id
- event_id
- assigned_to_id (user ID)
- assigned_to_type (client | venue | vendor)
- name (brief description)
- description (detailed context)
- priority (low | medium | high | urgent)
- status (pending | completed | cancelled)
- form_schema (optional - JSON defining form fields)
- form_response (user's submitted data)
- due_date (optional)
- created_at, updated_at, completed_at
```

### Dynamic Forms

Tasks can optionally include a form schema that defines what input is needed:

```
FormSchema:
- title
- description
- fields: [
    {
      id, type, label, required, options, 
      validation, conditional_logic, help_text
    }
  ]
```

**Supported field types:** text, textarea, number, date, select, multiselect, radio, checkbox, file, etc.

**Frontend renders these dynamically** - no need to code specific form types.

---

## Orchestrator Tools

### create_task

Creates a new task for a user.

**Parameters:**
- event_id
- assigned_to_id, assigned_to_type
- name, description
- priority
- form_schema (optional)
- due_date (optional)

**When to use:** Orchestrator determines user input or approval is needed

**Example uses:**
- Client mentions wanting to change something → Create task for venue to review
- Vendor needs more information → Create task with specific questions
- Approaching deadline → Create reminder task

### update_task

Updates existing task.

**Parameters:**
- task_id
- Updates (status, priority, due_date, etc.)

### complete_task

Marks task complete and processes response.

**Parameters:**
- task_id
- form_response (if form was included)

**What happens:** Orchestrator receives completion event and decides next actions

### generate_form_schema

Helper for orchestrator to create appropriate form.

**Parameters:**
- purpose (what information is needed)
- context (event details, user type, etc.)

**Returns:** Suggested form schema

**Example:** "Need to know if vendor can accommodate menu change" → Returns schema with yes/no radio + conditional fields

---

## Orchestrator Guidelines

### Task Creation Principles

**Create tasks when:**
- A decision is needed from a specific person
- Structured information must be collected
- An approval or confirmation is required
- A deadline-driven action is needed

**Don't create tasks when:**
- Information can be provided conversationally
- The orchestrator can handle it automatically
- It's purely informational
- There's no clear action required

### Task Design Principles

**Good task names:**
- Action-oriented: "Confirm guest count" not "Guest count"
- Specific to the situation
- Brief (5-8 words)

**Good descriptions:**
- Explain why the task exists
- Provide necessary context
- Be clear about what's needed
- Set expectations (timeline, impact, etc.)

**Form design:**
- Ask minimum questions needed
- Use appropriate field types
- Include help text for clarity
- Use conditional logic to reduce complexity
- Provide sensible defaults

**Priority assignment:**
- Urgent: Immediate action needed (< 24 hours)
- High: Important, near-term (< 1 week)
- Medium: Standard planning (1-4 weeks)
- Low: Nice-to-have, flexible timing

---

## Task Lifecycle

### 1. Task Created

Orchestrator calls `create_task` with appropriate parameters.

**User sees:**
- Task appears in their task list
- Notification sent (in-app, possibly email)
- Task shows priority, due date if applicable

### 2. User Completes Task

User opens task, fills out form (if present), submits.

**System:**
- Validates input
- Marks task complete
- Sends completion event to orchestrator

### 3. Orchestrator Processes

Orchestrator receives task completion with response data.

**Orchestrator decides:**
- What to update in the system
- Whether to create follow-up tasks
- What messages to send
- Next steps in coordination

---

## Example Scenarios

### Scenario 1: Client Requests Change

**Conversation:**
Client: "Can we add more vegetarian options to the menu?"

**Orchestrator thinks:**
- This affects the catering element
- Caterer needs to respond
- Venue should be aware

**Actions:**
1. Create task for vendor: "Menu customization request"
   - Form asking if they can accommodate, pricing impact, options available
   - Priority: medium
2. Add note to event about request
3. Respond to client: "I've sent this request to the caterer. You should hear back within 24 hours."

**After vendor completes task:**
- Orchestrator reviews response
- If approved with price change: Create task for client to approve pricing
- If declined: Create task for venue to find solution
- Update element notes with outcome

### Scenario 2: Approaching Event Date

**Trigger:** Event is 7 days away

**Orchestrator checks:**
- Has final guest count been provided?
- Are all vendors confirmed?
- Any pending items?

**If guest count missing:**
- Create task for client: "Provide final guest count"
- Form with number input, dietary restrictions, any changes needed
- Priority: high
- Due: event date

**After client completes:**
- Update event data
- Notify caterer and venue of final count
- Check if count affects other elements

### Scenario 3: Payment Issue

**Trigger:** Payment fails

**Orchestrator creates:**
- Task for venue: "Payment failed - follow up"
- Description includes client name, amount, failure reason
- Priority: high
- Simple form: action taken (contacted client / retrying / other)

**After venue completes:**
- Log action
- If issue resolved: Update payment status
- If still pending: Create reminder task

---

## UI/UX Considerations

### Task List

**Display:**
- Simple, scannable list
- Priority indicator (color dot or icon)
- Task name and event
- Due date if applicable

**Actions:**
- Click to open detail
- Mark complete (if no form)
- Snooze/defer options

### Task Detail

**Shows:**
- Full description
- Event context link
- Form fields (if applicable)
- Due date countdown
- Complete/Cancel buttons

**Form rendering:**
- Dynamic based on schema
- Client-side validation
- Progressive disclosure (conditional fields)
- Clear error messages

---

## System Prompt Guidelines for Orchestrator

The orchestrator should be prompted with principles like:

**Your Role:**
You coordinate event planning by creating tasks when human input is needed, processing responses, and deciding next actions. Use tasks sparingly - only when structured input or explicit approval is required.

**Creating Tasks:**
- Create tasks when you need specific information or approval
- Include forms when you need structured data
- Keep forms simple - ask only what's necessary
- Set appropriate priority based on urgency and impact
- Include clear descriptions explaining why the task exists

**Processing Completions:**
- Review task responses in context of the full event
- Decide what actions to take (update data, create follow-up tasks, send messages)
- Keep all parties informed of relevant changes
- Don't over-communicate - consolidate updates when possible

**Workflow Judgment:**
- Use your judgment about what needs approval vs. what you can handle
- Consider user preferences and past behavior
- Balance automation with human oversight
- Default to creating tasks for decisions with significant impact (pricing, major changes, vendor selection)

**Examples:**
[Include 3-5 example scenarios showing good task creation and processing]

---

## Event Lifecycle Touchpoints

While workflows aren't rigid, certain moments typically require attention:

**Early Planning (Confirmed → In Planning):**
- Suggest appropriate elements
- Get client approval on selections
- Assign vendors where needed

**Mid Planning (weeks before):**
- Coordinate customizations
- Confirm details
- Address any changes

**Final Preparations (days before):**
- Final guest count
- Final confirmations
- Last-minute adjustments

**Post-Event:**
- Feedback collection
- Wrap-up tasks

**Let the orchestrator determine specific tasks based on each event's unique situation.**

---

## Monitoring & Improvement

### Metrics to Track

**Task effectiveness:**
- Completion rate
- Time to complete
- Tasks cancelled or ignored
- User feedback on task clarity

**Orchestrator performance:**
- Appropriate use of tasks vs. direct actions
- Task priority accuracy
- Form design effectiveness
- User satisfaction

### Continuous Improvement

The orchestrator can learn from:
- Which tasks are completed quickly vs. slowly
- Which forms are confusing (high cancellation, support requests)
- User feedback and complaints
- Patterns in successful vs. problematic events

Use this data to refine orchestrator prompts and improve task creation patterns.

---

## Technical Notes

### Task Storage

Tasks stored in database with full history and metadata.

### Real-time Updates

Task creation/completion triggers real-time UI updates via Supabase subscriptions.

### Notifications

Task assignment triggers notifications based on priority and user preferences.

### Form Validation

Both client-side (immediate feedback) and server-side (security) validation required.

---

## Key Principle

**Keep it simple.** The orchestrator is smart enough to figure out what tasks are needed. Don't hardcode complex workflows - provide good tools, clear guidelines, and let the AI do its job.