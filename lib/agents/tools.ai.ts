/**
 * AI Agent Tool Definitions (Vercel AI SDK)
 *
 * Tools defined using Zod schemas and Vercel AI SDK tool() function.
 * Each tool includes schema validation and execution logic.
 */

import { z } from 'zod';
import { tool } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';

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
 * Factory function to create CLIENT tools
 */
export function createClientTools(
  supabase: SupabaseClient<Database>,
  context: ToolContext
) {
  return {
    get_element_details: tool({
      description: 'Get full details of an available offering including description, pricing, and vendor info.',
      inputSchema: z.object({
        element_id: z.string().uuid().describe('Element UUID'),
      }),
      execute: async ({ element_id }) => {
        const element = await getElement(supabase, element_id);
        return element;
      },
    }),

    add_element_to_event: tool({
      description: 'Add an offering to the client\'s event.',
      inputSchema: z.object({
        event_id: z.string().uuid().describe('Event UUID'),
        element_id: z.string().uuid().describe('Element UUID'),
        customization: z.string().nullable().describe('Special instructions'),
      }),
      execute: async ({ event_id, element_id, customization }) => {
        // Verify client owns this event
        const event = await getEvent(supabase, event_id);
        if (!event || event.client_id !== context.userId) {
          throw new Error('Unauthorized: Event does not belong to this client');
        }

        // Get element to get base price
        const element = await getElement(supabase, element_id);
        if (!element) throw new Error('Element not found');

        // Check availability
        const available = await isElementAvailable(supabase, element_id, event.date.toISOString());
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

    request_element_change: tool({
      description: 'Request a change to an existing event element (creates task for venue).',
      inputSchema: z.object({
        event_element_id: z.string().uuid().describe('Event element UUID'),
        change_description: z.string().describe('What needs to change'),
        urgent: z.boolean().nullable().describe('Is this urgent?'),
      }),
      execute: async ({ event_element_id, change_description, urgent }) => {
        // Get event element to find event and verify ownership
        const { data: eventElement } = await supabase
          .from('event_elements')
          .select('event_id, events!inner(client_id, venue_id)')
          .eq('event_element_id', event_element_id)
          .single();

        if (!eventElement || eventElement.events.client_id !== context.userId) {
          throw new Error('Unauthorized');
        }

        // Create task for venue to handle the change request
        const task = await createTask(supabase, {
          event_id: eventElement.event_id,
          assigned_to_id: eventElement.events.venue_id,
          assigned_to_type: 'venue',
          status: 'pending',
          name: 'Client requested change',
          description: change_description,
          priority: urgent ? 'high' : 'medium',
          created_by: context.userId,
        });

        return task;
      },
    }),

    add_guest: tool({
      description: 'Add a guest to the event.',
      inputSchema: z.object({
        event_id: z.string().uuid(),
        name: z.string(),
        email: z.string().email().nullable(),
        phone: z.string().nullable(),
        dietary_restrictions: z.string().nullable(),
        plus_one: z.boolean().nullable(),
      }),
      execute: async ({ event_id, name, email, phone, dietary_restrictions, plus_one }) => {
        // Verify access to event
        const event = await getEvent(supabase, event_id);
        if (!event) throw new Error('Event not found');

        if (context.userType === 'client' && event.client_id !== context.userId) {
          throw new Error('Unauthorized');
        }

        const guest = await createGuest(supabase, {
          event_id,
          name,
          email: email ?? undefined,
          phone: phone ?? undefined,
          dietary_restrictions: dietary_restrictions ?? undefined,
          plus_one: plus_one ?? false,
          rsvp_status: 'undecided',
        });

        return guest;
      },
    }),

    update_guest: tool({
      description: 'Update a guest\'s information.',
      inputSchema: z.object({
        guest_id: z.string().uuid(),
        name: z.string().nullable(),
        email: z.string().email().nullable(),
        rsvp_status: z.enum(['yes', 'no', 'undecided']).nullable(),
        dietary_restrictions: z.string().nullable(),
        plus_one: z.boolean().nullable(),
      }),
      execute: async ({ guest_id, name, email, rsvp_status, dietary_restrictions, plus_one }) => {
        const updates: any = {};
        if (name !== null) updates.name = name;
        if (email !== null) updates.email = email;
        if (rsvp_status !== null) updates.rsvp_status = rsvp_status;
        if (dietary_restrictions !== null) updates.dietary_restrictions = dietary_restrictions;
        if (plus_one !== null) updates.plus_one = plus_one;

        const guest = await updateGuest(supabase, guest_id, updates);
        return guest;
      },
    }),

    remove_guest: tool({
      description: 'Remove a guest from the event.',
      inputSchema: z.object({
        guest_id: z.string().uuid(),
      }),
      execute: async ({ guest_id }) => {
        await deleteGuest(supabase, guest_id);
        return { success: true };
      },
    }),

    get_task_details: tool({
      description: 'Get full task details including form schema.',
      inputSchema: z.object({
        task_id: z.string().uuid(),
      }),
      execute: async ({ task_id }) => {
        const task = await getTask(supabase, task_id);
        return task;
      },
    }),

    complete_task: tool({
      description: 'Complete a task with optional form response. The form_response should be a JSON string if provided.',
      inputSchema: z.object({
        task_id: z.string().uuid(),
        form_response: z.string().nullable().describe('JSON string of form response data'),
      }),
      execute: async ({ task_id, form_response }) => {
        // Parse form_response if it's a JSON string
        let formResponse: any = undefined;
        if (form_response) {
          try {
            formResponse = JSON.parse(form_response);
          } catch {
            formResponse = form_response;
          }
        }

        const task = await completeTask(
          supabase,
          task_id,
          formResponse,
          context.userId,
          context.userType
        );
        return task;
      },
    }),

    search_available_elements: tool({
      description: 'Search for offerings by category or keyword.',
      inputSchema: z.object({
        venue_id: z.string().uuid(),
        search_term: z.string(),
      }),
      execute: async ({ venue_id, search_term }) => {
        const elements = await searchElements(supabase, search_term, venue_id);
        return elements;
      },
    }),
  };
}

/**
 * Factory function to create VENUE GENERAL tools
 */
export function createVenueGeneralTools(
  supabase: SupabaseClient<Database>,
  context: ToolContext
) {
  return {
    list_events: tool({
      description: 'List all events with optional filters.',
      inputSchema: z.object({
        status: z.enum(['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled']).nullable(),
        start_date: z.string().nullable(),
        end_date: z.string().nullable(),
        client_id: z.string().uuid().nullable(),
      }),
      execute: async ({ status, start_date, end_date, client_id }) => {
        let query = supabase
          .from('events')
          .select('*')
          .eq('venue_id', context.userId);

        if (status) query = query.eq('status', status);
        if (start_date) query = query.gte('date', start_date);
        if (end_date) query = query.lte('date', end_date);
        if (client_id) query = query.eq('client_id', client_id);

        const { data } = await query;
        return data;
      },
    }),

    get_event_summary: tool({
      description: 'Get high-level summary of a specific event.',
      inputSchema: z.object({
        event_id: z.string().uuid(),
      }),
      execute: async ({ event_id }) => {
        const event = await getEvent(supabase, event_id);
        return event;
      },
    }),

    create_event: tool({
      description: 'Create a new event.',
      inputSchema: z.object({
        name: z.string(),
        date: z.string().describe('ISO 8601 format'),
        client_id: z.string().uuid().nullable(),
        venue_id: z.string().uuid(),
        description: z.string().nullable(),
      }),
      execute: async ({ name, date, client_id, venue_id, description }) => {
        const event = await createEvent(supabase, {
          name,
          date: new Date(date),
          client_id: client_id ?? undefined,
          venue_id,
          description: description ?? undefined,
          status: 'inquiry',
        });
        return event;
      },
    }),

    list_vendors: tool({
      description: 'List all vendors and their approval status.',
      inputSchema: z.object({
        approval_status: z.enum(['pending', 'approved', 'rejected']).nullable(),
      }),
      execute: async ({ approval_status }) => {
        let query = supabase
          .from('venue_vendors')
          .select('*, vendors(*)')
          .eq('venue_id', context.userId);

        if (approval_status) {
          query = query.eq('approval_status', approval_status);
        }

        const { data } = await query;
        return data;
      },
    }),

    update_vendor_approval: tool({
      description: 'Approve or reject a vendor.',
      inputSchema: z.object({
        venue_vendor_id: z.string().uuid(),
        approval_status: z.enum(['approved', 'rejected']),
      }),
      execute: async ({ venue_vendor_id, approval_status }) => {
        const { data, error } = await supabase
          .from('venue_vendors')
          .update({ approval_status })
          .eq('venue_vendor_id', venue_vendor_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
    }),

    create_element: tool({
      description: 'Create a new offering for the venue.',
      inputSchema: z.object({
        venue_vendor_id: z.string().uuid(),
        name: z.string(),
        category: z.string(),
        price: z.number(),
        description: z.string(),
      }),
      execute: async ({ venue_vendor_id, name, category, price, description }) => {
        const element = await createElement(supabase, {
          venue_vendor_id,
          name,
          category,
          price,
          description,
          files: [],
          availability_rules: { lead_time_days: 0 },
        });
        return element;
      },
    }),

    update_element: tool({
      description: 'Update an offering.',
      inputSchema: z.object({
        element_id: z.string().uuid(),
        name: z.string().nullable(),
        price: z.number().nullable(),
        description: z.string().nullable(),
      }),
      execute: async ({ element_id, name, price, description }) => {
        const updates: any = {};
        if (name !== null) updates.name = name;
        if (price !== null) updates.price = price;
        if (description !== null) updates.description = description;

        const element = await updateElement(supabase, element_id, updates);
        return element;
      },
    }),

    get_venue_dashboard: tool({
      description: 'Get dashboard with event counts, task summary, unread messages.',
      inputSchema: z.object({}),
      execute: async () => {
        // Get event counts by status
        const { data: events } = await supabase
          .from('events')
          .select('status')
          .eq('venue_id', context.userId);

        const eventCounts = events?.reduce((acc: any, event: any) => {
          acc[event.status] = (acc[event.status] || 0) + 1;
          return acc;
        }, {});

        // Get task counts
        const { data: tasks } = await supabase
          .from('tasks')
          .select('status')
          .eq('assigned_to_id', context.userId)
          .eq('assigned_to_type', 'venue');

        const taskCounts = tasks?.reduce((acc: any, task: any) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {});

        // Get unread message count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', context.userId)
          .eq('read', false);

        return {
          eventCounts,
          taskCounts,
          unreadMessageCount: unreadCount || 0,
        };
      },
    }),

    get_overdue_tasks: tool({
      description: 'Get all overdue tasks across all events.',
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from('tasks')
          .select('*, events(*)')
          .eq('assigned_to_id', context.userId)
          .eq('assigned_to_type', 'venue')
          .lt('due_date', new Date().toISOString())
          .neq('status', 'completed')
          .order('due_date', { ascending: true });

        return data;
      },
    }),
  };
}

/**
 * Factory function to create VENUE EVENT tools
 */
export function createVenueEventTools(
  supabase: SupabaseClient<Database>,
  context: ToolContext
) {
  return {
    update_event_status: tool({
      description: 'Change the event status (logs the change).',
      inputSchema: z.object({
        event_id: z.string().uuid(),
        new_status: z.enum(['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled']),
      }),
      execute: async ({ event_id, new_status }) => {
        const result = await changeEventStatus(
          supabase,
          event_id,
          new_status,
          context.userId,
          context.userType
        );
        return result;
      },
    }),

    update_event: tool({
      description: 'Update event details like name, date, description.',
      inputSchema: z.object({
        event_id: z.string().uuid(),
        name: z.string().nullable(),
        date: z.string().nullable(),
        description: z.string().nullable(),
        rsvp_deadline: z.string().nullable(),
      }),
      execute: async ({ event_id, name, date, description, rsvp_deadline }) => {
        const updates: any = {};
        if (name !== null) updates.name = name;
        if (date !== null) updates.date = new Date(date);
        if (description !== null) updates.description = description;
        if (rsvp_deadline !== null) updates.rsvp_deadline = new Date(rsvp_deadline);

        const event = await updateEvent(supabase, event_id, updates);
        return event;
      },
    }),

    add_element_to_event: tool({
      description: 'Add an element to this event.',
      inputSchema: z.object({
        event_id: z.string().uuid(),
        element_id: z.string().uuid(),
        amount: z.number(),
        customization: z.string().nullable(),
        notes: z.string().nullable(),
      }),
      execute: async ({ event_id, element_id, amount, customization, notes }) => {
        const result = await addElementToEvent(supabase, {
          event_id,
          element_id,
          amount,
          status: 'to-do',
          customization: customization ?? undefined,
          notes: notes ?? undefined,
          contract_completed: false,
        });
        return result;
      },
    }),

    update_event_element_status: tool({
      description: 'Update an event element status.',
      inputSchema: z.object({
        event_element_id: z.string().uuid(),
        new_status: z.enum(['to-do', 'in_progress', 'completed', 'needs_attention']),
      }),
      execute: async ({ event_element_id, new_status }) => {
        const result = await changeEventElementStatus(
          supabase,
          event_element_id,
          new_status,
          context.userId,
          context.userType
        );
        return result;
      },
    }),

    update_event_element: tool({
      description: 'Update event element details.',
      inputSchema: z.object({
        event_element_id: z.string().uuid(),
        customization: z.string().nullable(),
        amount: z.number().nullable(),
        notes: z.string().nullable(),
        contract_completed: z.boolean().nullable(),
      }),
      execute: async ({ event_element_id, customization, amount, notes, contract_completed }) => {
        const updates: any = {};
        if (customization !== null) updates.customization = customization;
        if (amount !== null) updates.amount = amount;
        if (notes !== null) updates.notes = notes;
        if (contract_completed !== null) updates.contract_completed = contract_completed;

        const result = await updateEventElement(supabase, event_element_id, updates);
        return result;
      },
    }),

    remove_element_from_event: tool({
      description: 'Remove an element from the event.',
      inputSchema: z.object({
        event_element_id: z.string().uuid(),
        reason: z.string().nullable(),
      }),
      execute: async ({ event_element_id }) => {
        const result = await removeElementFromEvent(supabase, event_element_id);
        return result;
      },
    }),

    create_task: tool({
      description: 'Create a task for client, vendor, or venue staff. The form_schema should be a JSON string if provided.',
      inputSchema: z.object({
        event_id: z.string().uuid(),
        assigned_to_id: z.string().uuid(),
        assigned_to_type: z.enum(['client', 'venue', 'vendor']),
        name: z.string(),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
        due_date: z.string().nullable(),
        form_schema: z.string().nullable().describe('JSON string of form schema'),
      }),
      execute: async ({ event_id, assigned_to_id, assigned_to_type, name, description, priority, due_date, form_schema }) => {
        // Parse form_schema if it's a JSON string
        let formSchema: any = undefined;
        if (form_schema) {
          try {
            formSchema = JSON.parse(form_schema);
          } catch {
            formSchema = form_schema;
          }
        }

        const task = await createTask(supabase, {
          event_id,
          assigned_to_id,
          assigned_to_type,
          status: 'pending',
          name,
          description,
          priority: priority ?? 'medium',
          due_date: due_date ? new Date(due_date) : undefined,
          form_schema: formSchema,
          created_by: context.userId,
        });
        return task;
      },
    }),

    update_task: tool({
      description: 'Update a task.',
      inputSchema: z.object({
        task_id: z.string().uuid(),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).nullable(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
        due_date: z.string().nullable(),
      }),
      execute: async ({ task_id, status, priority, due_date }) => {
        const updates: any = {};
        if (status !== null) updates.status = status;
        if (priority !== null) updates.priority = priority;
        if (due_date !== null) updates.due_date = new Date(due_date);

        const task = await updateTask(supabase, task_id, updates);
        return task;
      },
    }),

    complete_task: tool({
      description: 'Complete a task. The form_response should be a JSON string if provided.',
      inputSchema: z.object({
        task_id: z.string().uuid(),
        form_response: z.string().nullable().describe('JSON string of form response data'),
      }),
      execute: async ({ task_id, form_response }) => {
        // Parse form_response if it's a JSON string
        let formResponse: any = undefined;
        if (form_response) {
          try {
            formResponse = JSON.parse(form_response);
          } catch {
            formResponse = form_response;
          }
        }

        const task = await completeTask(
          supabase,
          task_id,
          formResponse,
          context.userId,
          context.userType
        );
        return task;
      },
    }),

    add_guest: tool({
      description: 'Add a guest to the event.',
      inputSchema: z.object({
        event_id: z.string().uuid(),
        name: z.string(),
        email: z.string().email().nullable(),
        phone: z.string().nullable(),
        dietary_restrictions: z.string().nullable(),
      }),
      execute: async ({ event_id, name, email, phone, dietary_restrictions }) => {
        const guest = await createGuest(supabase, {
          event_id,
          name,
          email: email ?? undefined,
          phone: phone ?? undefined,
          dietary_restrictions: dietary_restrictions ?? undefined,
          plus_one: false,
          rsvp_status: 'undecided',
        });
        return guest;
      },
    }),

    update_guest: tool({
      description: 'Update guest information.',
      inputSchema: z.object({
        guest_id: z.string().uuid(),
        rsvp_status: z.enum(['yes', 'no', 'undecided']).nullable(),
        dietary_restrictions: z.string().nullable(),
      }),
      execute: async ({ guest_id, rsvp_status, dietary_restrictions }) => {
        const updates: any = {};
        if (rsvp_status !== null) updates.rsvp_status = rsvp_status;
        if (dietary_restrictions !== null) updates.dietary_restrictions = dietary_restrictions;

        const guest = await updateGuest(supabase, guest_id, updates);
        return guest;
      },
    }),

    get_guest_statistics: tool({
      description: 'Get guest stats for the event.',
      inputSchema: z.object({
        event_id: z.string().uuid(),
      }),
      execute: async ({ event_id }) => {
        const stats = await getGuestStats(supabase, event_id);
        return stats;
      },
    }),

    mark_message_as_read: tool({
      description: 'Mark a message as read.',
      inputSchema: z.object({
        message_id: z.string().uuid(),
      }),
      execute: async ({ message_id }) => {
        await markMessageAsRead(supabase, message_id);
        return { success: true };
      },
    }),
  };
}

/**
 * Helper to get tools by agent type
 */
export function getToolsForAgent(
  agentType: 'client' | 'venue_general' | 'venue_event',
  supabase: SupabaseClient<Database>,
  context: ToolContext
) {
  switch (agentType) {
    case 'client':
      return createClientTools(supabase, context);
    case 'venue_general':
      return createVenueGeneralTools(supabase, context);
    case 'venue_event':
      return createVenueEventTools(supabase, context);
    default:
      return {};
  }
}
