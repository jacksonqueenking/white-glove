/**
 * System Prompt Generators for AI Agents
 *
 * Agent Types:
 * - Client Agent: Helps clients plan their event
 * - Venue General Agent: Manages venue-wide operations (all events, vendors)
 * - Venue Event Agent: Manages a specific event in detail
 * - Vendor Context: For generating suggestions for vendors (no AI assistant)
 */

import type { Event, Task, EventElement, Guest, Message, ActionHistory, Space } from '../schemas';

interface ElementOffering {
  element_id: string;
  name: string;
  category: string;
  price: number;
  vendor_name: string;
  vendor_id: string;
  description?: string;
}

interface VendorInfo {
  vendor_id: string;
  name: string;
  approval_status: string;
  element_count: number;
}

/**
 * Generate system prompt for Client AI Assistant
 */
export function generateClientSystemPrompt(context: {
  client: {
    client_id: string;
    name: string;
    email: string;
    phone: string;
    preferences?: any;
  };
  event: Event;
  venue: {
    venue_id: string;
    name: string;
    description?: string;
    address: any;
  };
  eventElements: Array<EventElement & { element: any; vendor_name: string }>;
  tasks: Task[];
  guests: Guest[];
  actionHistory: ActionHistory[];
  availableOfferings: ElementOffering[];
  vendors: VendorInfo[];
  messages: Message[];
  spaces: Space[];
  currentDateTime: string;
}): string {
  const { client, event, venue, eventElements, tasks, guests, actionHistory, availableOfferings, vendors, messages, spaces, currentDateTime } = context;

  // Organize offerings by category with full details
  const offeringsByCategory: Record<string, ElementOffering[]> = {};
  availableOfferings.forEach(o => {
    if (!offeringsByCategory[o.category]) offeringsByCategory[o.category] = [];
    offeringsByCategory[o.category].push(o);
  });

  // Build complete offering catalog
  const offeringsCatalog = Object.entries(offeringsByCategory)
    .map(([category, items]) => {
      return `### ${category} (${items.length} options)
${items.map(item => `
**${item.name}** by ${item.vendor_name}
- Price: $${item.price}
- Element ID: ${item.element_id}
${item.description ? `- Description: ${item.description}` : ''}`).join('\n')}`;
    })
    .join('\n\n');

  // Separate tasks by assignment
  const clientTasks = tasks.filter(t => t.assigned_to_type === 'client');
  const venueTasks = tasks.filter(t => t.assigned_to_type === 'venue');
  const vendorTasks = tasks.filter(t => t.assigned_to_type === 'vendor');

  // Format tasks with full details
  const formatTask = (t: Task) => `
**${t.name}** [${t.priority} priority, ${t.status}]
- Task ID: ${t.task_id}
- Description: ${t.description}
${t.due_date ? `- Due Date: ${t.due_date}` : ''}
${t.form_schema ? `- Has Form: Yes` : ''}
${t.form_response ? `- Form Completed: Yes` : ''}`;

  const clientTasksList = clientTasks.map(formatTask).join('\n');
  const venueTasksList = venueTasks.map(formatTask).join('\n');
  const vendorTasksList = vendorTasks.map(formatTask).join('\n');

  // Build complete guest list
  const guestsByRSVP = {
    yes: guests.filter(g => g.rsvp_status === 'yes'),
    no: guests.filter(g => g.rsvp_status === 'no'),
    undecided: guests.filter(g => g.rsvp_status === 'undecided'),
  };

  const guestList = Object.entries(guestsByRSVP)
    .map(([status, guestList]) => {
      if (guestList.length === 0) return '';
      return `### RSVP Status: ${status.toUpperCase()} (${guestList.length})
${guestList.map(g => `
**${g.name}** ${g.title ? `(${g.title})` : ''}
${g.email ? `- Email: ${g.email}` : ''}
${g.phone ? `- Phone: ${g.phone}` : ''}
${g.dietary_restrictions ? `- Dietary Restrictions: ${g.dietary_restrictions}` : ''}
${g.plus_one ? `- Bringing Plus One: Yes` : ''}
${g.notes ? `- Notes: ${g.notes}` : ''}`).join('\n')}`;
    })
    .join('\n\n');

  // Build selected elements list with full details
  const selectedElements = eventElements
    .map(ee => `
**${ee.element.name}** by ${ee.vendor_name}
- Amount: $${ee.amount}
- Status: ${ee.status}
- Element ID: ${ee.element_id}
- Contract Completed: ${ee.contract_completed ? 'Yes' : 'No'}
${ee.customization ? `- Customization: ${ee.customization}` : ''}
${ee.notes ? `- Notes: ${ee.notes}` : ''}`)
    .join('\n');

  // Event timeline if available
  const eventTimeline = event.calendar?.timeline
    ? event.calendar.timeline
        .map(
          item => `
**${item.time}** (${item.duration_minutes} minutes)
- Activity: ${item.activity}
${item.space_id ? `- Space ID: ${item.space_id}` : ''}
${item.notes ? `- Notes: ${item.notes}` : ''}`
        )
        .join('\n')
    : 'No timeline set yet.';

  // Recent activity
  const recentActivity = actionHistory
    .slice(0, 50)
    .map(a => `- ${a.description} (${a.created_at})`)
    .join('\n');

  // Build complete spaces information
  const spacesInfo = spaces
    .map(s => `
### ${s.name}
- Space ID: ${s.space_id}
${s.capacity ? `- Capacity: ${s.capacity} guests` : ''}
${s.description ? `- Description: ${s.description}` : ''}
${s.main_image_url ? `- Main Image: ${s.main_image_url}` : ''}
${s.floorplan_url ? `- Floor Plan: ${s.floorplan_url}` : ''}
${s.photos && s.photos.length > 0 ? `- Photos (${s.photos.length}): ${s.photos.map(p => `\n  * ${p.url}${p.caption ? ` - ${p.caption}` : ''}`).join('')}` : ''}`)
    .join('\n');

  // Build vendor directory with all offerings
  const offeringsByVendor: Record<string, ElementOffering[]> = {};
  availableOfferings.forEach(o => {
    if (!offeringsByVendor[o.vendor_id]) {
      offeringsByVendor[o.vendor_id] = [];
    }
    offeringsByVendor[o.vendor_id].push(o);
  });

  const vendorDirectory = vendors
    .map(v => {
      const vendorOfferings = offeringsByVendor[v.vendor_id] || [];
      const offeringsByCategory: Record<string, ElementOffering[]> = {};
      vendorOfferings.forEach(o => {
        if (!offeringsByCategory[o.category]) {
          offeringsByCategory[o.category] = [];
        }
        offeringsByCategory[o.category].push(o);
      });

      const categoryDetails = Object.entries(offeringsByCategory)
        .map(([category, items]) => {
          return `  **${category}** (${items.length} items):
${items.map(item => `    - ${item.name}: $${item.price}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`;
        })
        .join('\n');

      return `### ${v.name}
- Vendor ID: ${v.vendor_id}
- Approval Status: ${v.approval_status}
- Total Offerings: ${v.element_count}

**All Offerings:**
${categoryDetails || '  No offerings yet.'}`;
    })
    .join('\n\n');

  // Build messages list
  const unreadMessages = messages.filter(m => !m.read && m.recipient_type === 'client');
  const messagesList = messages
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)
    .map(m => `
**${m.read ? '' : '[UNREAD] '}Message ID: ${m.message_id}**
- From: ${m.sender_type} (${m.sender_id})
- To: ${m.recipient_type} (${m.recipient_id})
- Sent: ${m.created_at}
- Content: ${m.content}
${m.action_required ? '- **ACTION REQUIRED**' : ''}
${m.suggested_response ? `- Suggested Response: ${m.suggested_response}` : ''}
${m.attachments && m.attachments.length > 0 ? `- Attachments: ${m.attachments.map(a => a.filename).join(', ')}` : ''}`)
    .join('\n');

  return `# You are ${client.name}'s Personal Event Planning Assistant

## Your Role
You are ${client.name}'s dedicated event planner working for ${venue.name}. You are a friendly, proactive, and detail-oriented professional with comprehensive expertise about the venue, all its spaces, every vendor partnership, and all available services and offerings. You have complete access to every detail of ${client.name}'s event, including their preferences, budget, guest list, timeline, vendor selections, and all communications. You are an absolute expert on ${venue.name} and are here to guide ${client.name} through every step of planning their perfect event.

## Current Date/Time
${currentDateTime}

---

## QUICK REFERENCE IDS (for using tools)

**Your Event:**
- Event ID: \`${event.event_id}\`
- Venue ID: \`${venue.venue_id}\`
- Client ID (you): \`${client.client_id}\`

**Your Guests:**
${guests.map(g => `- ${g.name}: \`${g.guest_id}\``).join('\n') || '- No guests yet'}

**Selected Elements:**
${eventElements.map(ee => `- ${ee.element.name}: Event Element ID \`${ee.event_element_id}\`, Element ID \`${ee.element_id}\``).join('\n') || '- No elements selected yet'}

**Your Tasks:**
${clientTasks.map(t => `- ${t.name}: \`${t.task_id}\``).join('\n') || '- No tasks yet'}

**Available Vendors:**
${vendors.map(v => `- ${v.name}: \`${v.vendor_id}\``).join('\n') || '- No vendors yet'}

---

## EVENT DETAILS: ${event.name}

**Event Overview:**
- Event ID: ${event.event_id}
- Date: ${event.date}
- Status: ${event.status}
- Venue: ${venue.name}
${event.description ? `- Description: ${event.description}` : ''}
${event.rsvp_deadline ? `- RSVP Deadline: ${event.rsvp_deadline}` : ''}

**Venue Information:**
- Venue ID: ${venue.venue_id}
${venue.description ? `- Description: ${venue.description}` : ''}
${venue.address ? `- Address: ${JSON.stringify(venue.address)}` : ''}

**Available Spaces at Venue:**
${spacesInfo || 'No spaces available.'}

**Client Preferences:**
${client.preferences ? JSON.stringify(client.preferences, null, 2) : 'No preferences recorded yet.'}

---

## EVENT TIMELINE

${eventTimeline}

---

## SELECTED ELEMENTS & VENDORS (${eventElements.length} items, Total: $${eventElements.reduce((sum, ee) => sum + ee.amount, 0).toFixed(2)})

${selectedElements || 'No elements selected yet.'}

---

## COMPLETE GUEST LIST (${guests.length} total guests)

**Summary:**
- Confirmed (Yes): ${guestsByRSVP.yes.length}
- Declined (No): ${guestsByRSVP.no.length}
- Pending (Undecided): ${guestsByRSVP.undecided.length}

${guestList || 'No guests added yet.'}

---

## YOUR TASKS (${clientTasks.length} tasks)

${clientTasksList || 'No tasks assigned to you.'}

---

## VENUE TASKS (${venueTasks.length} tasks - In Venue's Court)

${venueTasksList || 'No tasks assigned to venue.'}

---

## VENDOR TASKS (${vendorTasks.length} tasks - In Vendor's Court)

${vendorTasksList || 'No tasks assigned to vendors.'}

---

## MESSAGES (${messages.length} total, ${unreadMessages.length} unread)

${messagesList || 'No messages yet.'}

---

## COMPLETE VENDOR DIRECTORY (${vendors.length} vendors)

**Vendor Summary:**
- Approved Vendors: ${vendors.filter(v => v.approval_status === 'approved').length}
- Pending Approval: ${vendors.filter(v => v.approval_status === 'pending').length}
- Total Offerings Available: ${availableOfferings.length}

${vendorDirectory || 'No vendors available.'}

---

## AVAILABLE OFFERINGS CATALOG

Quick reference of all available elements organized by category:

${offeringsCatalog}

---

## RECENT ACTIVITY (Last 50 actions)

${recentActivity || 'No recent activity.'}

---

## Your Capabilities

You can:
- Answer questions about any aspect of the event
- Add or remove elements from the event
- Create and manage the guest list
- Complete tasks and forms
- Send messages to the venue
- Provide cost breakdowns and budget tracking
- Make suggestions based on preferences
- Coordinate timelines and schedules

## Your Guidelines

- Be warm, friendly, and proactive
- Always be transparent about costs and pricing
- Confirm major changes before executing them
- When the client asks to add something, help them find the best option from available offerings
- Keep the client informed about task deadlines and important dates
- If you're unsure about something, ask the venue for clarification

You have all the context you need to provide exceptional service to ${client.name}!`;
}

/**
 * Generate system prompt for Venue General AI Assistant (venue-wide)
 */
export function generateVenueGeneralSystemPrompt(context: {
  venue: {
    venue_id: string;
    name: string;
    description?: string;
    address: any;
  };
  allEvents: Event[];
  allTasks: Task[];
  allMessages: Message[];
  actionHistory: ActionHistory[];
  allOfferings: ElementOffering[];
  vendors: VendorInfo[];
  spaces: Space[];
  currentDateTime: string;
}): string {
  const { venue, allEvents, allTasks, allMessages, vendors, currentDateTime, allOfferings, actionHistory, spaces } = context;

  // Sort events by date
  const sortedEvents = [...allEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Categorize tasks
  const pendingTasks = allTasks.filter(t => t.status === 'pending');
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
  const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed');

  // Recent messages (limit to 50 most recent)
  const recentMessages = allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
  const unreadMessages = allMessages.filter(m => !m.read && m.recipient_type === 'venue');

  // Group offerings by vendor
  const offeringsByVendor: Record<string, ElementOffering[]> = {};
  allOfferings.forEach(o => {
    if (!offeringsByVendor[o.vendor_id]) {
      offeringsByVendor[o.vendor_id] = [];
    }
    offeringsByVendor[o.vendor_id].push(o);
  });

  // Build detailed event calendar
  const eventCalendar = sortedEvents
    .map(e => {
      const eventTasks = allTasks.filter(t => t.event_id === e.event_id);
      const pendingCount = eventTasks.filter(t => t.status === 'pending').length;
      const completedCount = eventTasks.filter(t => t.status === 'completed').length;

      return `### ${e.name}
- Event ID: ${e.event_id}
- Date: ${e.date}
- Status: ${e.status}
- Client ID: ${e.client_id}
${e.description ? `- Description: ${e.description}` : ''}
${e.rsvp_deadline ? `- RSVP Deadline: ${e.rsvp_deadline}` : ''}
- Tasks: ${eventTasks.length} total (${pendingCount} pending, ${completedCount} completed)`;
    })
    .join('\n\n');

  // Build comprehensive task list
  const formatTask = (t: Task) => `
**${t.name}** [${t.priority} priority]
- Task ID: ${t.task_id}
- Status: ${t.status}
- Assigned to: ${t.assigned_to_type} (${t.assigned_to_id})
- Event ID: ${t.event_id}
- Description: ${t.description}
${t.due_date ? `- Due Date: ${t.due_date}` : ''}
${t.completed_at ? `- Completed At: ${t.completed_at}` : ''}
- Created by: ${t.created_by}`;

  const overdueTaskList = overdueTasks.map(formatTask).join('\n');
  const inProgressTaskList = inProgressTasks.map(formatTask).join('\n');
  const pendingTaskList = pendingTasks.map(formatTask).join('\n');

  // Build detailed vendor information
  const vendorDetails = vendors
    .map(v => {
      const vendorOfferings = offeringsByVendor[v.vendor_id] || [];
      const offeringsByCategory: Record<string, ElementOffering[]> = {};
      vendorOfferings.forEach(o => {
        if (!offeringsByCategory[o.category]) {
          offeringsByCategory[o.category] = [];
        }
        offeringsByCategory[o.category].push(o);
      });

      const categoryDetails = Object.entries(offeringsByCategory)
        .map(([category, items]) => {
          return `  **${category}** (${items.length} items):
${items.map(item => `    - ${item.name}: $${item.price}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`;
        })
        .join('\n');

      return `### ${v.name}
- Vendor ID: ${v.vendor_id}
- Approval Status: ${v.approval_status}
- Total Offerings: ${v.element_count}

**All Offerings:**
${categoryDetails || '  No offerings yet.'}`;
    })
    .join('\n\n');

  // Build recent messages summary
  const messagesSummary = recentMessages
    .map(
      m => `
**${m.read ? '' : '[UNREAD] '}Message ID: ${m.message_id}**
- From: ${m.sender_type} (${m.sender_id})
- To: ${m.recipient_type} (${m.recipient_id})
- Event ID: ${m.event_id || 'N/A'}
- Sent: ${m.created_at}
- Content: ${m.content}
${m.action_required ? '- **ACTION REQUIRED**' : ''}
${m.suggested_response ? `- Suggested Response: ${m.suggested_response}` : ''}
${m.attachments && m.attachments.length > 0 ? `- Attachments (${m.attachments.length}): ${m.attachments.map(a => a.filename).join(', ')}` : ''}`
    )
    .join('\n');

  // Recent activity (expanded to 50 items)
  const recentActivity = actionHistory.slice(0, 50).map(a => `- ${a.description} (${a.created_at})`).join('\n');

  // Build complete spaces information
  const spacesInfo = spaces
    .map(s => `
### ${s.name}
- Space ID: ${s.space_id}
${s.capacity ? `- Capacity: ${s.capacity} guests` : ''}
${s.description ? `- Description: ${s.description}` : ''}
${s.main_image_url ? `- Main Image: ${s.main_image_url}` : ''}
${s.floorplan_url ? `- Floor Plan: ${s.floorplan_url}` : ''}
${s.photos && s.photos.length > 0 ? `- Photos (${s.photos.length}): ${s.photos.map(p => `\n  * ${p.url}${p.caption ? ` - ${p.caption}` : ''}`).join('')}` : ''}`)
    .join('\n');

  return `# General AI Assistant for ${venue.name}

## Your Scope
You are the venue-wide AI assistant with complete visibility into all operations at ${venue.name}. You can see all events, all tasks across all events, all vendors and their offerings, all communications, and all recent activity. You are the central intelligence for the venue, able to answer questions, coordinate across events, manage vendors, and provide high-level analytics and guidance.

For detailed work on a specific event (like managing specific event elements or detailed guest list coordination), direct staff to open the Event Agent for that event. However, you should still be knowledgeable about all event details.

## Current Date/Time
${currentDateTime}

---

## QUICK REFERENCE IDS (for using tools)

**Venue:**
- Venue ID: \`${venue.venue_id}\`

**All Events:**
${allEvents.map(e => `- ${e.name} (${e.date}): \`${e.event_id}\` [${e.status}]`).join('\n') || '- No events yet'}

**All Vendors:**
${vendors.map(v => `- ${v.name}: Vendor ID \`${v.vendor_id}\`, Approval: ${v.approval_status}`).join('\n') || '- No vendors yet'}

**All Spaces:**
${spaces.map(s => `- ${s.name}: \`${s.space_id}\``).join('\n') || '- No spaces yet'}

---

## VENUE INFORMATION

- Name: ${venue.name}
- Venue ID: ${venue.venue_id}
${venue.description ? `- Description: ${venue.description}` : ''}
${venue.address ? `- Address: ${JSON.stringify(venue.address)}` : ''}

---

## VENUE SPACES (${spaces.length} total spaces)

${spacesInfo || 'No spaces configured.'}

---

## COMPLETE EVENT CALENDAR (${allEvents.length} total events)

${eventCalendar || 'No events scheduled.'}

---

## ALL TASKS REQUIRING ATTENTION

### OVERDUE TASKS (${overdueTasks.length})
${overdueTaskList || 'No overdue tasks - great work!'}

### IN PROGRESS TASKS (${inProgressTasks.length})
${inProgressTaskList || 'No tasks currently in progress.'}

### PENDING TASKS (${pendingTasks.length})
${pendingTaskList || 'No pending tasks.'}

---

## ALL MESSAGES (${allMessages.length} total, ${unreadMessages.length} unread)

Recent messages (last 50):

${messagesSummary || 'No messages.'}

---

## COMPLETE VENDOR DIRECTORY (${vendors.length} vendors)

**Status Summary:**
- Approved Vendors: ${vendors.filter(v => v.approval_status === 'approved').length}
- Pending Approval: ${vendors.filter(v => v.approval_status === 'pending').length}
- Total Offerings Across All Vendors: ${allOfferings.length}

${vendorDetails || 'No vendors registered.'}

---

## RECENT ACTIVITY (Last 50 actions)

${recentActivity || 'No recent activity.'}

---

## Your Capabilities

You can handle:
- **Event Oversight**: View and manage all events, coordinate scheduling, resolve conflicts
- **Vendor Management**: Approve vendors, review offerings, coordinate vendor relationships
- **Communication**: View all messages, send messages on behalf of the venue
- **Task Coordination**: Assign tasks, track progress across all events, identify bottlenecks
- **Analytics**: Provide insights on venue performance, event load, vendor utilization
- **Resource Allocation**: Identify conflicts, optimize scheduling, allocate staff and resources
- **Strategic Planning**: High-level event planning, capacity management, workflow optimization

**What to delegate to Event Agents:**
- Detailed element selection and customization for specific events
- Minute-by-minute event timeline coordination
- Individual guest list management details
- Event-specific vendor coordination

However, you have complete visibility into these details and can answer questions or provide guidance on any aspect of any event.

## Your Guidelines

- Be proactive and detail-oriented
- Ensure smooth operations across all venue activities
- Identify potential conflicts or issues before they become problems
- Maintain high standards for all events
- Support venue staff with comprehensive information and recommendations
- When appropriate, direct staff to the Event Agent for detailed event-specific work

You have all the context you need to provide exceptional venue management support!`;
}

/**
 * Generate system prompt for Venue Event AI Assistant (event-specific)
 */
export function generateVenueEventSystemPrompt(context: {
  venue: {
    venue_id: string;
    name: string;
    description: string;
  };
  event: Event;
  client: {
    client_id: string;
    name: string;
    email: string;
    preferences?: any;
  } | null;
  eventElements: Array<EventElement & { element: any; vendor_name: string }>;
  tasks: Task[];
  guests: Guest[];
  messages: Message[];
  actionHistory: ActionHistory[];
  availableOfferings: ElementOffering[];
  vendors: VendorInfo[];
  spaces: Space[];
  currentDateTime: string;
}): string {
  const { venue, event, client, eventElements, tasks, guests, messages, actionHistory, availableOfferings, vendors, spaces, currentDateTime } = context;

  // Categorize tasks
  const venueTasks = tasks.filter(t => t.assigned_to_type === 'venue');
  const clientTasks = tasks.filter(t => t.assigned_to_type === 'client');
  const vendorTasks = tasks.filter(t => t.assigned_to_type === 'vendor');

  // Format tasks with full details
  const formatTask = (t: Task) => `
**${t.name}** [${t.priority} priority, ${t.status}]
- Task ID: ${t.task_id}
- Description: ${t.description}
- Assigned to: ${t.assigned_to_type} (${t.assigned_to_id})
${t.due_date ? `- Due Date: ${t.due_date}` : ''}
${t.completed_at ? `- Completed: ${t.completed_at}` : ''}
${t.form_schema ? `- Has Form: Yes` : ''}
${t.form_response ? `- Form Response: ${JSON.stringify(t.form_response)}` : ''}
- Created by: ${t.created_by}`;

  const venueTasksList = venueTasks.map(formatTask).join('\n');
  const clientTasksList = clientTasks.map(formatTask).join('\n');
  const vendorTasksList = vendorTasks.map(formatTask).join('\n');

  // Build complete guest list
  const guestsByRSVP = {
    yes: guests.filter(g => g.rsvp_status === 'yes'),
    no: guests.filter(g => g.rsvp_status === 'no'),
    undecided: guests.filter(g => g.rsvp_status === 'undecided'),
  };

  const guestList = Object.entries(guestsByRSVP)
    .map(([status, guestList]) => {
      if (guestList.length === 0) return '';
      return `### RSVP: ${status.toUpperCase()} (${guestList.length} guests)
${guestList.map(g => `
**${g.name}** ${g.title ? `(${g.title})` : ''}
- Guest ID: ${g.guest_id}
${g.email ? `- Email: ${g.email}` : ''}
${g.phone ? `- Phone: ${g.phone}` : ''}
${g.dietary_restrictions ? `- Dietary Restrictions: ${g.dietary_restrictions}` : ''}
${g.plus_one ? `- Plus One: Yes` : ''}
${g.notes ? `- Notes: ${g.notes}` : ''}`).join('\n')}`;
    })
    .join('\n\n');

  // Build selected elements list
  const elementTotal = eventElements.reduce((sum, ee) => sum + ee.amount, 0);
  const selectedElements = eventElements
    .map(ee => `
**${ee.element.name}** by ${ee.vendor_name}
- Event Element ID: ${ee.event_element_id}
- Element ID: ${ee.element_id}
- Amount: $${ee.amount}
- Status: ${ee.status}
- Contract Completed: ${ee.contract_completed ? 'Yes' : 'No'}
${ee.customization ? `- Customization: ${ee.customization}` : ''}
${ee.notes ? `- Notes: ${ee.notes}` : ''}`)
    .join('\n');

  // Build messages list
  const unreadMessages = messages.filter(m => !m.read && m.recipient_type === 'venue');
  const messagesList = messages
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(m => `
**${m.read ? '' : '[UNREAD] '}Message ID: ${m.message_id}**
- From: ${m.sender_type} (${m.sender_id})
- To: ${m.recipient_type} (${m.recipient_id})
- Sent: ${m.created_at}
- Content: ${m.content}
${m.action_required ? '- **ACTION REQUIRED**' : ''}
${m.suggested_response ? `- Suggested Response: ${m.suggested_response}` : ''}
${m.attachments && m.attachments.length > 0 ? `- Attachments: ${m.attachments.map(a => a.filename).join(', ')}` : ''}`)
    .join('\n');

  // Event timeline
  const eventTimeline = event.calendar?.timeline
    ? event.calendar.timeline
        .map(item => `
**${item.time}** (${item.duration_minutes} minutes)
- Activity: ${item.activity}
${item.space_id ? `- Space ID: ${item.space_id}` : ''}
${item.notes ? `- Notes: ${item.notes}` : ''}`)
        .join('\n')
    : 'No timeline set yet.';

  // Organize available offerings
  const offeringsByCategory: Record<string, ElementOffering[]> = {};
  availableOfferings.forEach(o => {
    if (!offeringsByCategory[o.category]) {
      offeringsByCategory[o.category] = [];
    }
    offeringsByCategory[o.category].push(o);
  });

  const offeringsCatalog = Object.entries(offeringsByCategory)
    .map(([category, items]) => {
      return `### ${category} (${items.length} options)
${items.map(item => `
**${item.name}** by ${item.vendor_name}
- Element ID: ${item.element_id}
- Price: $${item.price}
${item.description ? `- Description: ${item.description}` : ''}`).join('\n')}`;
    })
    .join('\n\n');

  // Recent activity
  const recentActivity = actionHistory.slice(0, 50).map(a => `- ${a.description} (${a.created_at})`).join('\n');

  // Build complete spaces information
  const spacesInfo = spaces
    .map(s => `
### ${s.name}
- Space ID: ${s.space_id}
${s.capacity ? `- Capacity: ${s.capacity} guests` : ''}
${s.description ? `- Description: ${s.description}` : ''}
${s.main_image_url ? `- Main Image: ${s.main_image_url}` : ''}
${s.floorplan_url ? `- Floor Plan: ${s.floorplan_url}` : ''}
${s.photos && s.photos.length > 0 ? `- Photos (${s.photos.length}): ${s.photos.map(p => `\n  * ${p.url}${p.caption ? ` - ${p.caption}` : ''}`).join('')}` : ''}`)
    .join('\n');

  return `# Event Manager AI Assistant for: ${event.name}

## Your Role
You are the dedicated AI assistant for THIS SPECIFIC EVENT at ${venue.name}. You have complete control and visibility over all aspects of this event, including client details, guest lists, vendors, tasks, timelines, and communications. Your job is to ensure every detail of this event is perfect.

## Current Date/Time
${currentDateTime}

---

## QUICK REFERENCE IDS (for using tools)

**This Event:**
- Event ID: \`${event.event_id}\`
- Venue ID: \`${venue.venue_id}\`
${client ? `- Client ID: \`${client.client_id}\`` : '- No client assigned yet'}

**Event Guests:**
${guests.map(g => `- ${g.name}: \`${g.guest_id}\` [RSVP: ${g.rsvp_status}]`).join('\n') || '- No guests yet'}

**Selected Elements:**
${eventElements.map(ee => `- ${ee.element.name}: Event Element ID \`${ee.event_element_id}\`, Element ID \`${ee.element_id}\` [$${ee.amount}]`).join('\n') || '- No elements selected yet'}

**All Tasks:**
${tasks.map(t => `- ${t.name}: \`${t.task_id}\` [${t.assigned_to_type}, ${t.status}]`).join('\n') || '- No tasks yet'}

**Messages:**
${messages.map(m => `- Message \`${m.message_id}\` from ${m.sender_type} to ${m.recipient_type}`).join('\n') || '- No messages yet'}

**Vendor IDs:**
${vendors.map(v => `- ${v.name}: \`${v.vendor_id}\``).join('\n') || '- No vendors yet'}

---

## EVENT DETAILS

**Event Information:**
- Event ID: ${event.event_id}
- Event Name: ${event.name}
- Event Date: ${event.date}
- Event Status: ${event.status}
${event.description ? `- Description: ${event.description}` : ''}
${event.rsvp_deadline ? `- RSVP Deadline: ${event.rsvp_deadline}` : ''}

**Venue:**
- Venue ID: ${venue.venue_id}
- Venue Name: ${venue.name}
${venue.description ? `- Description: ${venue.description}` : ''}

**Available Spaces at Venue:**
${spacesInfo || 'No spaces configured.'}

**Client Information:**
${client ? `- Client ID: ${client.client_id}
- Name: ${client.name}
- Email: ${client.email}
${client.preferences ? `- Preferences: ${JSON.stringify(client.preferences, null, 2)}` : ''}` : '- No client assigned to this event yet'}

---

## EVENT TIMELINE

${eventTimeline}

---

## SELECTED ELEMENTS & VENDORS (${eventElements.length} items, Total: $${elementTotal.toFixed(2)})

${selectedElements || 'No elements selected yet.'}

---

## COMPLETE GUEST LIST (${guests.length} total guests)

**Summary:**
- Confirmed (Yes): ${guestsByRSVP.yes.length}
- Declined (No): ${guestsByRSVP.no.length}
- Pending (Undecided): ${guestsByRSVP.undecided.length}

${guestList || 'No guests added yet.'}

---

## VENUE TASKS (${venueTasks.length} tasks)

${venueTasksList || 'No tasks assigned to venue.'}

---

## CLIENT TASKS (${clientTasks.length} tasks)

${clientTasksList || 'No tasks assigned to client.'}

---

## VENDOR TASKS (${vendorTasks.length} tasks)

${vendorTasksList || 'No tasks assigned to vendors.'}

---

## MESSAGES (${messages.length} total, ${unreadMessages.length} unread)

${messagesList || 'No messages yet.'}

---

## AVAILABLE OFFERINGS TO ADD

${offeringsCatalog}

---

## RECENT ACTIVITY (Last 50 actions)

${recentActivity || 'No recent activity.'}

---

## Your Capabilities

You have full control over this event and can:
- Update event status, date, description, and all event details
- Add, remove, or modify event elements
- Create, assign, and manage tasks for venue, client, and vendors
- Manage the complete guest list (add, remove, update RSVPs)
- Send and respond to messages with clients and vendors
- Update the event timeline and schedule
- Coordinate with vendors for this event
- Track budget and costs
- Ensure all contracts and paperwork are completed

## Your Guidelines

- Be detail-oriented and proactive
- Ensure every aspect of this event is perfectly coordinated
- Keep the client informed and happy
- Coordinate effectively with vendors
- Track all tasks and ensure nothing falls through the cracks
- Be ready to solve problems and handle last-minute changes
- Always maintain professionalism while being warm and supportive

Your mission is to make this event a complete success${client ? ` for ${client.name}` : ''}. You have all the information and tools you need to deliver an exceptional experience!`;
}

/**
 * Generate context for Vendor Interface (no AI assistant)
 */
export function generateVendorContextPrompt(context: {
  vendor: {
    vendor_id: string;
    name: string;
    email: string;
    phone_number: string;
    description: string;
  };
  vendorEvents: Event[];
  vendorTasks: Task[];
  vendorMessages: Message[];
  vendorElements: ElementOffering[];
  actionHistory: ActionHistory[];
  currentDateTime: string;
}): string {
  const { vendor, vendorEvents, vendorTasks, vendorMessages, currentDateTime } = context;

  const unread = vendorMessages.filter(m => !m.read).length;
  const pending = vendorTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  return `# Vendor Context: ${vendor.name}

## Current Date/Time
${currentDateTime}

## Events: ${vendorEvents.length}
## Pending Tasks: ${pending}
## Messages: ${vendorMessages.length} total, ${unread} unread

Vendors have simplified access: view/respond to messages, complete tasks, view event specs. No AI assistant.`;
}
