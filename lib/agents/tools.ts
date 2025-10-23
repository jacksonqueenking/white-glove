/**
 * AI Agent Tool Definitions
 *
 * Tools defined using Zod schemas and OpenAI Agents SDK tool() function.
 * Each tool includes schema validation and execution logic.
 */

import { z } from 'zod';
import { tool } from '@openai/agents';
import { createClient } from '../supabase/client';

// Import database functions
import { getElement, isElementAvailable, searchElements, createElement, updateElement } from '../db/elements';
import { addElementToEvent, updateEventElement, removeElementFromEvent, changeEventElementStatus } from '../db/event_elements';
import { createGuest, updateGuest, deleteGuest, getGuestStats } from '../db/guests';
import { getTask, createTask, updateTask, completeTask } from '../db/tasks';
import { markMessageAsRead } from '../db/messages';
import { getEvent, updateEvent, changeEventStatus, createEvent } from '../db/events';

/**
 * Context passed to all tool handlers
 */
export interface ToolContext {
  userId: string;
  userType: 'client' | 'venue' | 'vendor';
}

/**
 * CLIENT TOOLS
 */

export const getElementDetailsTool = tool({
  name: 'get_element_details',
  description: 'Get full details of an available offering including description, pricing, and vendor info.',
  parameters: z.object({
    element_id: z.string().uuid().describe('Element UUID'),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const element = await getElement(supabase, input.element_id);
    return element;
  },
});

export const addElementToEventTool = tool({
  name: 'add_element_to_event',
  description: 'Add an offering to the client\'s event.',
  parameters: z.object({
    event_id: z.string().uuid().describe('Event UUID'),
    element_id: z.string().uuid().describe('Element UUID'),
    customization: z.string().nullable().describe('Special instructions'),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Verify client owns this event
    const event = await getEvent(supabase, input.event_id);
    if (!event || event.client_id !== toolContext.userId) {
      throw new Error('Unauthorized: Event does not belong to this client');
    }

    // Get element to get base price
    const element = await getElement(supabase, input.element_id);
    if (!element) throw new Error('Element not found');

    // Check availability
    const available = await isElementAvailable(supabase, input.element_id, event.date.toISOString());
    if (!available) {
      throw new Error('Element is not available for this date');
    }

    const result = await addElementToEvent(supabase, {
      event_id: input.event_id,
      element_id: input.element_id,
      amount: element.price,
      status: 'to-do',
      customization: input.customization ?? undefined,
      contract_completed: false,
    });

    return result;
  },
});

export const requestElementChangeTool = tool({
  name: 'request_element_change',
  description: 'Request a change to an existing event element (creates task for venue).',
  parameters: z.object({
    event_element_id: z.string().uuid().describe('Event element UUID'),
    change_description: z.string().describe('What needs to change'),
    urgent: z.boolean().nullable().describe('Is this urgent?'),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Get event element to find event and verify ownership
    const { data: eventElement } = await supabase
      .from('event_elements')
      .select('event_id, events!inner(client_id, venue_id)')
      .eq('event_element_id', input.event_element_id)
      .single();

    if (!eventElement || eventElement.events.client_id !== toolContext.userId) {
      throw new Error('Unauthorized');
    }

    // Create task for venue to handle the change request
    const task = await createTask(supabase, {
      event_id: eventElement.event_id,
      assigned_to_id: eventElement.events.venue_id,
      assigned_to_type: 'venue',
      status: 'pending',
      name: 'Client requested change',
      description: input.change_description,
      priority: input.urgent ? 'high' : 'medium',
      created_by: toolContext.userId,
    });

    return task;
  },
});

export const addGuestTool = tool({
  name: 'add_guest',
  description: 'Add a guest to the event.',
  parameters: z.object({
    event_id: z.string().uuid(),
    name: z.string(),
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    dietary_restrictions: z.string().nullable(),
    plus_one: z.boolean().nullable(),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Verify access to event
    const event = await getEvent(supabase, input.event_id);
    if (!event) throw new Error('Event not found');

    if (toolContext.userType === 'client' && event.client_id !== toolContext.userId) {
      throw new Error('Unauthorized');
    }
    if (toolContext.userType === 'venue' && event.venue_id !== toolContext.userId) {
      throw new Error('Unauthorized');
    }

    const guest = await createGuest(supabase, {
      event_id: input.event_id,
      name: input.name,
      email: input.email ?? undefined,
      phone: input.phone ?? undefined,
      dietary_restrictions: input.dietary_restrictions ?? undefined,
      plus_one: input.plus_one ?? false,
      rsvp_status: 'undecided',
    });

    return guest;
  },
});

export const updateGuestTool = tool({
  name: 'update_guest',
  description: 'Update a guest\'s information.',
  parameters: z.object({
    guest_id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    rsvp_status: z.enum(['yes', 'no', 'undecided']).nullable(),
    dietary_restrictions: z.string().nullable(),
    plus_one: z.boolean().nullable(),
  }),
  execute: async (input, context) => {
    const supabase = createClient();

    const updates: any = {};
    if (input.name !== null) updates.name = input.name;
    if (input.email !== null) updates.email = input.email;
    if (input.rsvp_status !== null) updates.rsvp_status = input.rsvp_status;
    if (input.dietary_restrictions !== null) updates.dietary_restrictions = input.dietary_restrictions;
    if (input.plus_one !== null) updates.plus_one = input.plus_one;

    const guest = await updateGuest(supabase, input.guest_id, updates);
    return guest;
  },
});

export const removeGuestTool = tool({
  name: 'remove_guest',
  description: 'Remove a guest from the event.',
  parameters: z.object({
    guest_id: z.string().uuid(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    await deleteGuest(supabase, input.guest_id);
    return { success: true };
  },
});

export const getTaskDetailsTool = tool({
  name: 'get_task_details',
  description: 'Get full task details including form schema.',
  parameters: z.object({
    task_id: z.string().uuid(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const task = await getTask(supabase, input.task_id);
    return task;
  },
});

export const completeTaskTool = tool({
  name: 'complete_task',
  description: 'Complete a task with optional form response. The form_response should be a JSON string if provided.',
  parameters: z.object({
    task_id: z.string().uuid(),
    form_response: z.string().nullable().describe('JSON string of form response data'),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Parse form_response if it's a JSON string
    let formResponse: any = undefined;
    if (input.form_response) {
      try {
        formResponse = JSON.parse(input.form_response);
      } catch {
        formResponse = input.form_response;
      }
    }

    const task = await completeTask(
      supabase,
      input.task_id,
      formResponse,
      toolContext.userId,
      toolContext.userType
    );
    return task;
  },
});

// Removed sendMessageToVenueTool - will be reimplemented later with proper thread support

export const searchAvailableElementsTool = tool({
  name: 'search_available_elements',
  description: 'Search for offerings by category or keyword.',
  parameters: z.object({
    venue_id: z.string().uuid(),
    search_term: z.string(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const elements = await searchElements(supabase, input.search_term, input.venue_id);
    return elements;
  },
});

export const clientTools = [
  getElementDetailsTool,
  addElementToEventTool,
  requestElementChangeTool,
  addGuestTool,
  updateGuestTool,
  removeGuestTool,
  getTaskDetailsTool,
  completeTaskTool,
  // sendMessageToVenueTool - removed, will be reimplemented later
  searchAvailableElementsTool,
];

/**
 * VENUE GENERAL TOOLS
 */

export const listEventsTool = tool({
  name: 'list_events',
  description: 'List all events with optional filters.',
  parameters: z.object({
    status: z.enum(['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled']).nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    client_id: z.string().uuid().nullable(),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    let query = supabase
      .from('events')
      .select('*')
      .eq('venue_id', toolContext.userId);

    if (input.status) query = query.eq('status', input.status);
    if (input.start_date) query = query.gte('date', input.start_date);
    if (input.end_date) query = query.lte('date', input.end_date);
    if (input.client_id) query = query.eq('client_id', input.client_id);

    const { data } = await query;
    return data;
  },
});

export const getEventSummaryTool = tool({
  name: 'get_event_summary',
  description: 'Get high-level summary of a specific event.',
  parameters: z.object({
    event_id: z.string().uuid(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const event = await getEvent(supabase, input.event_id);
    return event;
  },
});

export const createEventTool = tool({
  name: 'create_event',
  description: 'Create a new event.',
  parameters: z.object({
    name: z.string(),
    date: z.string().describe('ISO 8601 format'),
    client_id: z.string().uuid().nullable(),
    venue_id: z.string().uuid(),
    description: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const event = await createEvent(supabase, {
      name: input.name,
      date: new Date(input.date),
      client_id: input.client_id ?? undefined,
      venue_id: input.venue_id,
      description: input.description ?? undefined,
      status: 'inquiry',
    });
    return event;
  },
});

export const listVendorsTool = tool({
  name: 'list_vendors',
  description: 'List all vendors and their approval status.',
  parameters: z.object({
    approval_status: z.enum(['pending', 'approved', 'rejected']).nullable(),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    let query = supabase
      .from('venue_vendors')
      .select('*, vendors(*)')
      .eq('venue_id', toolContext.userId);

    if (input.approval_status) {
      query = query.eq('approval_status', input.approval_status);
    }

    const { data } = await query;
    return data;
  },
});

export const updateVendorApprovalTool = tool({
  name: 'update_vendor_approval',
  description: 'Approve or reject a vendor.',
  parameters: z.object({
    venue_vendor_id: z.string().uuid(),
    approval_status: z.enum(['approved', 'rejected']),
  }),
  execute: async (input) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('venue_vendors')
      .update({ approval_status: input.approval_status })
      .eq('venue_vendor_id', input.venue_vendor_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
});

export const createElementTool = tool({
  name: 'create_element',
  description: 'Create a new offering for the venue.',
  parameters: z.object({
    venue_vendor_id: z.string().uuid(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    description: z.string(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const element = await createElement(supabase, {
      venue_vendor_id: input.venue_vendor_id,
      name: input.name,
      category: input.category,
      price: input.price,
      description: input.description,
      files: [],
      availability_rules: { lead_time_days: 0 },
    });
    return element;
  },
});

export const updateElementTool = tool({
  name: 'update_element',
  description: 'Update an offering.',
  parameters: z.object({
    element_id: z.string().uuid(),
    name: z.string().nullable(),
    price: z.number().nullable(),
    description: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();

    const updates: any = {};
    if (input.name !== null) updates.name = input.name;
    if (input.price !== null) updates.price = input.price;
    if (input.description !== null) updates.description = input.description;

    const element = await updateElement(supabase, input.element_id, updates);
    return element;
  },
});

// Removed sendMessageTool - will be reimplemented later with proper thread support

export const getVenueDashboardTool = tool({
  name: 'get_venue_dashboard',
  description: 'Get dashboard with event counts, task summary, unread messages.',
  parameters: z.object({}),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Get event counts by status
    const { data: events } = await supabase
      .from('events')
      .select('status')
      .eq('venue_id', toolContext.userId);

    const eventCounts = events?.reduce((acc: any, event: any) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {});

    // Get task counts
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('assigned_to_id', toolContext.userId)
      .eq('assigned_to_type', 'venue');

    const taskCounts = tasks?.reduce((acc: any, task: any) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // Get unread message count
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', toolContext.userId)
      .eq('read', false);

    return {
      eventCounts,
      taskCounts,
      unreadMessageCount: unreadCount || 0,
    };
  },
});

export const getOverdueTasksTool = tool({
  name: 'get_overdue_tasks',
  description: 'Get all overdue tasks across all events.',
  parameters: z.object({}),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    const { data } = await supabase
      .from('tasks')
      .select('*, events(*)')
      .eq('assigned_to_id', toolContext.userId)
      .eq('assigned_to_type', 'venue')
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    return data;
  },
});

export const venueGeneralTools = [
  listEventsTool,
  getEventSummaryTool,
  createEventTool,
  listVendorsTool,
  updateVendorApprovalTool,
  createElementTool,
  updateElementTool,
  // sendMessageTool - removed, will be reimplemented later
  getVenueDashboardTool,
  getOverdueTasksTool,
];

/**
 * VENUE EVENT TOOLS
 */

export const updateEventStatusTool = tool({
  name: 'update_event_status',
  description: 'Change the event status (logs the change).',
  parameters: z.object({
    event_id: z.string().uuid(),
    new_status: z.enum(['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled']),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;
    const result = await changeEventStatus(
      supabase,
      input.event_id,
      input.new_status,
      toolContext.userId,
      toolContext.userType
    );
    return result;
  },
});

export const updateEventTool = tool({
  name: 'update_event',
  description: 'Update event details like name, date, description.',
  parameters: z.object({
    event_id: z.string().uuid(),
    name: z.string().nullable(),
    date: z.string().nullable(),
    description: z.string().nullable(),
    rsvp_deadline: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();

    const updates: any = {};
    if (input.name !== null) updates.name = input.name;
    if (input.date !== null) updates.date = new Date(input.date);
    if (input.description !== null) updates.description = input.description;
    if (input.rsvp_deadline !== null) updates.rsvp_deadline = new Date(input.rsvp_deadline);

    const event = await updateEvent(supabase, input.event_id, updates);
    return event;
  },
});

export const addElementToEventVenueTool = tool({
  name: 'add_element_to_event',
  description: 'Add an element to this event.',
  parameters: z.object({
    event_id: z.string().uuid(),
    element_id: z.string().uuid(),
    amount: z.number(),
    customization: z.string().nullable(),
    notes: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const result = await addElementToEvent(supabase, {
      event_id: input.event_id,
      element_id: input.element_id,
      amount: input.amount,
      status: 'to-do',
      customization: input.customization ?? undefined,
      notes: input.notes ?? undefined,
      contract_completed: false,
    });
    return result;
  },
});

export const updateEventElementStatusTool = tool({
  name: 'update_event_element_status',
  description: 'Update an event element status.',
  parameters: z.object({
    event_element_id: z.string().uuid(),
    new_status: z.enum(['to-do', 'in_progress', 'completed', 'needs_attention']),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;
    const result = await changeEventElementStatus(
      supabase,
      input.event_element_id,
      input.new_status,
      toolContext.userId,
      toolContext.userType
    );
    return result;
  },
});

export const updateEventElementTool = tool({
  name: 'update_event_element',
  description: 'Update event element details.',
  parameters: z.object({
    event_element_id: z.string().uuid(),
    customization: z.string().nullable(),
    amount: z.number().nullable(),
    notes: z.string().nullable(),
    contract_completed: z.boolean().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();

    const updates: any = {};
    if (input.customization !== null) updates.customization = input.customization;
    if (input.amount !== null) updates.amount = input.amount;
    if (input.notes !== null) updates.notes = input.notes;
    if (input.contract_completed !== null) updates.contract_completed = input.contract_completed;

    const result = await updateEventElement(supabase, input.event_element_id, updates);
    return result;
  },
});

export const removeElementFromEventTool = tool({
  name: 'remove_element_from_event',
  description: 'Remove an element from the event.',
  parameters: z.object({
    event_element_id: z.string().uuid(),
    reason: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const result = await removeElementFromEvent(supabase, input.event_element_id);
    return result;
  },
});

export const createTaskTool = tool({
  name: 'create_task',
  description: 'Create a task for client, vendor, or venue staff. The form_schema should be a JSON string if provided.',
  parameters: z.object({
    event_id: z.string().uuid(),
    assigned_to_id: z.string().uuid(),
    assigned_to_type: z.enum(['client', 'venue', 'vendor']),
    name: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
    due_date: z.string().nullable(),
    form_schema: z.string().nullable().describe('JSON string of form schema'),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Parse form_schema if it's a JSON string
    let formSchema: any = undefined;
    if (input.form_schema) {
      try {
        formSchema = JSON.parse(input.form_schema);
      } catch {
        formSchema = input.form_schema;
      }
    }

    const task = await createTask(supabase, {
      event_id: input.event_id,
      assigned_to_id: input.assigned_to_id,
      assigned_to_type: input.assigned_to_type,
      status: 'pending',
      name: input.name,
      description: input.description,
      priority: input.priority ?? 'medium',
      due_date: input.due_date ? new Date(input.due_date) : undefined,
      form_schema: formSchema,
      created_by: toolContext.userId,
    });
    return task;
  },
});

export const updateTaskTool = tool({
  name: 'update_task',
  description: 'Update a task.',
  parameters: z.object({
    task_id: z.string().uuid(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).nullable(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
    due_date: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();

    const updates: any = {};
    if (input.status !== null) updates.status = input.status;
    if (input.priority !== null) updates.priority = input.priority;
    if (input.due_date !== null) updates.due_date = new Date(input.due_date);

    const task = await updateTask(supabase, input.task_id, updates);
    return task;
  },
});

export const completeTaskVenueTool = tool({
  name: 'complete_task',
  description: 'Complete a task. The form_response should be a JSON string if provided.',
  parameters: z.object({
    task_id: z.string().uuid(),
    form_response: z.string().nullable().describe('JSON string of form response data'),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Parse form_response if it's a JSON string
    let formResponse: any = undefined;
    if (input.form_response) {
      try {
        formResponse = JSON.parse(input.form_response);
      } catch {
        formResponse = input.form_response;
      }
    }

    const task = await completeTask(
      supabase,
      input.task_id,
      formResponse,
      toolContext.userId,
      toolContext.userType
    );
    return task;
  },
});

export const addGuestVenueTool = tool({
  name: 'add_guest',
  description: 'Add a guest to the event.',
  parameters: z.object({
    event_id: z.string().uuid(),
    name: z.string(),
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    dietary_restrictions: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const guest = await createGuest(supabase, {
      event_id: input.event_id,
      name: input.name,
      email: input.email ?? undefined,
      phone: input.phone ?? undefined,
      dietary_restrictions: input.dietary_restrictions ?? undefined,
      plus_one: false,
      rsvp_status: 'undecided',
    });
    return guest;
  },
});

export const updateGuestVenueTool = tool({
  name: 'update_guest',
  description: 'Update guest information.',
  parameters: z.object({
    guest_id: z.string().uuid(),
    rsvp_status: z.enum(['yes', 'no', 'undecided']).nullable(),
    dietary_restrictions: z.string().nullable(),
  }),
  execute: async (input) => {
    const supabase = createClient();

    const updates: any = {};
    if (input.rsvp_status !== null) updates.rsvp_status = input.rsvp_status;
    if (input.dietary_restrictions !== null) updates.dietary_restrictions = input.dietary_restrictions;

    const guest = await updateGuest(supabase, input.guest_id, updates);
    return guest;
  },
});

export const getGuestStatisticsTool = tool({
  name: 'get_guest_statistics',
  description: 'Get guest stats for the event.',
  parameters: z.object({
    event_id: z.string().uuid(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const stats = await getGuestStats(supabase, input.event_id);
    return stats;
  },
});

// Removed sendMessageVenueTool - will be reimplemented later with proper thread support

export const markMessageAsReadTool = tool({
  name: 'mark_message_as_read',
  description: 'Mark a message as read.',
  parameters: z.object({
    message_id: z.string().uuid(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    await markMessageAsRead(supabase, input.message_id);
    return { success: true };
  },
});

export const venueEventTools = [
  updateEventStatusTool,
  updateEventTool,
  addElementToEventVenueTool,
  updateEventElementStatusTool,
  updateEventElementTool,
  removeElementFromEventTool,
  createTaskTool,
  updateTaskTool,
  completeTaskVenueTool,
  addGuestVenueTool,
  updateGuestVenueTool,
  getGuestStatisticsTool,
  // sendMessageVenueTool - removed, will be reimplemented later
  markMessageAsReadTool,
];

/**
 * VENDOR TOOLS
 */

export const getTaskDetailsVendorTool = tool({
  name: 'get_task_details',
  description: 'Get task details.',
  parameters: z.object({
    task_id: z.string().uuid(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    const task = await getTask(supabase, input.task_id);
    return task;
  },
});

export const completeTaskVendorTool = tool({
  name: 'complete_task',
  description: 'Complete a task. The form_response should be a JSON string if provided.',
  parameters: z.object({
    task_id: z.string().uuid(),
    form_response: z.string().nullable().describe('JSON string of form response data'),
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const toolContext = context?.context as ToolContext;

    // Parse form_response if it's a JSON string
    let formResponse: any = undefined;
    if (input.form_response) {
      try {
        formResponse = JSON.parse(input.form_response);
      } catch {
        formResponse = input.form_response;
      }
    }

    const task = await completeTask(
      supabase,
      input.task_id,
      formResponse,
      toolContext.userId,
      toolContext.userType
    );
    return task;
  },
});

// Removed sendMessageToVenueVendorTool - will be reimplemented later with proper thread support

export const markMessageAsReadVendorTool = tool({
  name: 'mark_message_as_read',
  description: 'Mark message as read.',
  parameters: z.object({
    message_id: z.string().uuid(),
  }),
  execute: async (input) => {
    const supabase = createClient();
    await markMessageAsRead(supabase, input.message_id);
    return { success: true };
  },
});

export const vendorTools = [
  getTaskDetailsVendorTool,
  completeTaskVendorTool,
  // sendMessageToVenueVendorTool - removed, will be reimplemented later
  markMessageAsReadVendorTool,
];

/**
 * Helper to get tools by agent type
 */
export function getToolsForAgent(agentType: 'client' | 'venue_general' | 'venue_event' | 'vendor') {
  switch (agentType) {
    case 'client':
      return clientTools;
    case 'venue_general':
      return venueGeneralTools;
    case 'venue_event':
      return venueEventTools;
    case 'vendor':
      return vendorTools;
    default:
      return [];
  }
}
