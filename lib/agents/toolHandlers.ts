/**
 * Tool Execution Handlers
 *
 * Maps AI agent tool calls to actual database functions.
 * Includes validation, permission checks, and error handling.
 */

import { z } from 'zod';
import { createClient } from '../supabase/client';
import { createServiceClient } from '../supabase/server';

// Import database functions
import { getElement, isElementAvailable, searchElements } from '../db/elements';
import { addElementToEvent, updateEventElement, updateEventElementContract, removeElementFromEvent, changeEventElementStatus } from '../db/event_elements';
import { createGuest, updateGuest, deleteGuest, getGuestStats, bulkCreateGuests } from '../db/guests';
import { getTask, createTask, updateTask, completeTask, cancelTask } from '../db/tasks';
import { sendMessage, markMessageAsRead, markThreadAsRead } from '../db/messages';
import { getEvent, updateEvent, changeEventStatus, createEvent } from '../db/events';
import { createElement, updateElement } from '../db/elements';

/**
 * Base handler interface
 */
interface ToolHandler {
  (params: any, context: { userId: string; userType: 'client' | 'venue' | 'vendor' }): Promise<any>;
}

/**
 * CLIENT TOOL HANDLERS
 */

export const clientToolHandlers: Record<string, ToolHandler> = {
  async get_element_details(params, context) {
    const supabase = createClient();
    const { element_id } = z.object({ element_id: z.string().uuid() }).parse(params);
    const element = await getElement(supabase, element_id);
    return element;
  },

  async add_element_to_event(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      element_id: z.string().uuid(),
      customization: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify client owns this event
    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.client_id !== context.userId) {
      throw new Error('Unauthorized: Event does not belong to this client');
    }

    // Get element to get base price
    const element = await getElement(supabase, validated.element_id);
    if (!element) throw new Error('Element not found');

    // Check availability
    const available = await isElementAvailable(supabase, validated.element_id, event.date.toISOString());
    if (!available) {
      throw new Error('Element is not available for this date');
    }

    const result = await addElementToEvent(supabase, {
      event_id: validated.event_id,
      element_id: validated.element_id,
      amount: element.price,
      status: 'to-do',
      customization: validated.customization,
      contract_completed: false,
    });

    return result;
  },

  async request_element_change(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_element_id: z.string().uuid(),
      change_description: z.string(),
      urgent: z.boolean().optional(),
    });
    const validated = schema.parse(params);

    // Get event element to find event and verify ownership
    const { data: eventElement } = await supabase
      .from('event_elements')
      .select('event_id, events!inner(client_id, venue_id)')
      .eq('event_element_id', validated.event_element_id)
      .single();

    if (!eventElement || eventElement.events.client_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    // Create task for venue to handle the change request
    const task = await createTask(supabase, {
      event_id: eventElement.event_id,
      assigned_to_id: eventElement.events.venue_id,
      assigned_to_type: 'venue',
      name: `Client requests element change`,
      description: `Client has requested a change to an event element:\n\n${validated.change_description}`,
      priority: validated.urgent ? 'high' : 'medium',
      status: 'pending',
      created_by: context.userId,
    });

    return { task, message: 'Change request submitted to venue' };
  },

  async add_guest(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      dietary_restrictions: z.string().optional(),
      plus_one: z.boolean().optional(),
    });
    const validated = schema.parse(params);

    // Verify client owns event
    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.client_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const guest = await createGuest(supabase, {
      ...validated,
      rsvp_status: 'undecided',
      plus_one: validated.plus_one ?? false,
    });

    return guest;
  },

  async update_guest(params, context) {
    const supabase = createClient();
    const schema = z.object({
      guest_id: z.string().uuid(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      rsvp_status: z.enum(['yes', 'no', 'undecided']).optional(),
      dietary_restrictions: z.string().optional(),
      plus_one: z.boolean().optional(),
    });
    const validated = schema.parse(params);

    // Verify ownership through event
    const { data: guest } = await supabase
      .from('guests')
      .select('event_id, events!inner(client_id)')
      .eq('guest_id', validated.guest_id)
      .single();

    if (!guest || guest.events.client_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { guest_id, ...updates } = validated;
    const updated = await updateGuest(supabase, guest_id, updates);
    return updated;
  },

  async remove_guest(params, context) {
    const supabase = createClient();
    const { guest_id } = z.object({ guest_id: z.string().uuid() }).parse(params);

    // Verify ownership
    const { data: guest } = await supabase
      .from('guests')
      .select('event_id, events!inner(client_id)')
      .eq('guest_id', guest_id)
      .single();

    if (!guest || guest.events.client_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    await deleteGuest(supabase, guest_id);
    return { success: true };
  },

  async get_task_details(params, context) {
    const supabase = createClient();
    const { task_id } = z.object({ task_id: z.string().uuid() }).parse(params);

    const task = await getTask(supabase, task_id);
    if (!task || task.assigned_to_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    return task;
  },

  async complete_task(params, context) {
    const supabase = createClient();
    const schema = z.object({
      task_id: z.string().uuid(),
      form_response: z.string().optional(),
    });
    const validated = schema.parse(params);

    const task = await getTask(supabase, validated.task_id);
    if (!task || task.assigned_to_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    // Parse form_response if it's a JSON string
    const formResponse = validated.form_response
      ? JSON.parse(validated.form_response)
      : undefined;

    const completed = await completeTask(
      supabase,
      validated.task_id,
      formResponse,
      context.userId,
      context.userType
    );

    return completed;
  },

  async send_message_to_venue(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      content: z.string(),
      action_required: z.boolean().optional(),
    });
    const validated = schema.parse(params);

    // Verify client owns event
    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.client_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    // Create or get thread ID (simplified - use event_id as thread_id for now)
    const threadId = `event-${validated.event_id}`;

    const message = await sendMessage(supabase, {
      thread_id: threadId,
      event_id: validated.event_id,
      sender_id: context.userId,
      sender_type: 'client',
      recipient_id: event.venue_id,
      recipient_type: 'venue',
      content: validated.content,
      attachments: [],
      action_required: validated.action_required || false,
      read: false,
    });

    return message;
  },

  async search_available_elements(params, context) {
    const supabase = createClient();
    const schema = z.object({
      venue_id: z.string().uuid(),
      category: z.string().optional(),
      search_term: z.string().optional(),
      max_price: z.number().optional(),
    });
    const validated = schema.parse(params);

    let results;
    if (validated.search_term) {
      results = await searchElements(supabase, validated.search_term, validated.venue_id);
    } else {
      // Get all elements for venue, optionally filtered by category
      const { data } = await supabase
        .from('elements')
        .select('*, venue_vendors!inner(venue_id, vendors(name))')
        .eq('venue_vendors.venue_id', validated.venue_id)
        .is('deleted_at', null);

      results = data || [];
    }

    // Apply additional filters
    if (validated.category) {
      results = results.filter((e: any) => e.category === validated.category);
    }
    if (validated.max_price) {
      results = results.filter((e: any) => e.price <= validated.max_price!);
    }

    return results;
  },
};

/**
 * VENUE GENERAL TOOL HANDLERS
 */

export const venueGeneralToolHandlers: Record<string, ToolHandler> = {
  async list_events(params, context) {
    const supabase = createClient();
    const schema = z.object({
      status: z.enum(['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled']).optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      client_id: z.string().uuid().optional(),
    });
    const validated = schema.parse(params);

    // Verify user is venue
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('venue_id', context.userId)
      .is('deleted_at', null);

    let results = events || [];

    // Apply filters
    if (validated.status) {
      results = results.filter(e => e.status === validated.status);
    }
    if (validated.start_date) {
      results = results.filter(e => e.date >= validated.start_date!);
    }
    if (validated.end_date) {
      results = results.filter(e => e.date <= validated.end_date!);
    }
    if (validated.client_id) {
      results = results.filter(e => e.client_id === validated.client_id);
    }

    return results;
  },

  async get_event_summary(params, context) {
    const supabase = createClient();
    const { event_id } = z.object({ event_id: z.string().uuid() }).parse(params);

    const event = await getEvent(supabase, event_id);
    if (!event || event.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    // Get summary data
    const { data: elementCount } = await supabase
      .from('event_elements')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    const { data: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .neq('status', 'completed');

    const { data: guestCount } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    return {
      event,
      element_count: elementCount || 0,
      pending_task_count: taskCount || 0,
      guest_count: guestCount || 0,
    };
  },

  async create_event(params, context) {
    const supabase = createClient();
    const schema = z.object({
      name: z.string(),
      date: z.string(),
      client_id: z.string().uuid().optional(),
      venue_id: z.string().uuid(),
      description: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify venue_id matches context
    if (validated.venue_id !== context.userId) {
      throw new Error('Unauthorized: Can only create events for your own venue');
    }

    const event = await createEvent(supabase, {
      ...validated,
      date: new Date(validated.date),
      status: 'inquiry',
    });

    return event;
  },

  async list_vendors(params, context) {
    const supabase = createClient();
    const schema = z.object({
      approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
    });
    const validated = schema.parse(params);

    const query = supabase
      .from('venue_vendors')
      .select('*, vendors(*)')
      .eq('venue_id', context.userId);

    if (validated.approval_status) {
      query.eq('approval_status', validated.approval_status);
    }

    const { data } = await query;
    return data || [];
  },

  async update_vendor_approval(params, context) {
    const supabase = createClient();
    const schema = z.object({
      venue_vendor_id: z.string().uuid(),
      approval_status: z.enum(['approved', 'rejected']),
    });
    const validated = schema.parse(params);

    // Verify venue owns this relationship
    const { data: venueVendor } = await supabase
      .from('venue_vendors')
      .select('venue_id')
      .eq('venue_vendor_id', validated.venue_vendor_id)
      .single();

    if (!venueVendor || venueVendor.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { data } = await supabase
      .from('venue_vendors')
      .update({ approval_status: validated.approval_status })
      .eq('venue_vendor_id', validated.venue_vendor_id)
      .select()
      .single();

    return data;
  },

  async create_element(params, context) {
    const supabase = createClient();
    const schema = z.object({
      venue_vendor_id: z.string().uuid(),
      name: z.string(),
      category: z.string(),
      price: z.number(),
      description: z.string(),
      availability_rules: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify venue owns this venue_vendor relationship
    const { data: venueVendor } = await supabase
      .from('venue_vendors')
      .select('venue_id')
      .eq('venue_vendor_id', validated.venue_vendor_id)
      .single();

    if (!venueVendor || venueVendor.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    // Parse availability_rules if it's a JSON string
    const availabilityRules = validated.availability_rules
      ? JSON.parse(validated.availability_rules)
      : { lead_time_days: 0 };

    const element = await createElement(supabase, {
      ...validated,
      files: [],
      availability_rules: availabilityRules,
    });
    return element;
  },

  async update_element(params, context) {
    const supabase = createClient();
    const schema = z.object({
      element_id: z.string().uuid(),
      name: z.string().optional(),
      price: z.number().optional(),
      description: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify venue owns this element
    const { data: element } = await supabase
      .from('elements')
      .select('venue_vendors!inner(venue_id)')
      .eq('element_id', validated.element_id)
      .single();

    if (!element || element.venue_vendors.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { element_id, ...updates } = validated;
    const updated = await updateElement(supabase, element_id, updates);
    return updated;
  },

  async send_message(params, context) {
    const supabase = createClient();
    const schema = z.object({
      recipient_id: z.string().uuid(),
      recipient_type: z.enum(['client', 'vendor']),
      content: z.string(),
      event_id: z.string().uuid().optional(),
      action_required: z.boolean().optional(),
    });
    const validated = schema.parse(params);

    // Generate thread ID
    const threadId = validated.event_id
      ? `event-${validated.event_id}`
      : `direct-${context.userId}-${validated.recipient_id}`;

    const message = await sendMessage(supabase, {
      thread_id: threadId,
      event_id: validated.event_id,
      sender_id: context.userId,
      sender_type: 'venue',
      recipient_id: validated.recipient_id,
      recipient_type: validated.recipient_type,
      content: validated.content,
      attachments: [],
      action_required: validated.action_required || false,
      read: false,
    });

    return message;
  },

  async get_venue_dashboard(params, context) {
    const supabase = createClient();
    // Get event counts by status
    const { data: events } = await supabase
      .from('events')
      .select('status')
      .eq('venue_id', context.userId)
      .is('deleted_at', null);

    const eventCounts: Record<string, number> = {};
    events?.forEach(e => {
      eventCounts[e.status] = (eventCounts[e.status] || 0) + 1;
    });

    // Get task counts
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, events!inner(venue_id)')
      .eq('events.venue_id', context.userId);

    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
    const overdueTasks = tasks?.filter(t =>
      t.status !== 'completed' &&
      t.status !== 'cancelled'
    ).length || 0;

    // Get unread messages
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', context.userId)
      .eq('read', false);

    return {
      event_counts: eventCounts,
      pending_tasks: pendingTasks,
      overdue_tasks: overdueTasks,
      unread_messages: unreadCount || 0,
    };
  },

  async get_overdue_tasks(params, context) {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, events!inner(venue_id)')
      .eq('events.venue_id', context.userId)
      .lt('due_date', now)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true });

    return tasks || [];
  },
};

/**
 * VENUE EVENT TOOL HANDLERS
 */

export const venueEventToolHandlers: Record<string, ToolHandler> = {
  async update_event_status(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      new_status: z.enum(['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled']),
    });
    const validated = schema.parse(params);

    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const updated = await changeEventStatus(
      supabase,
      validated.event_id,
      validated.new_status,
      context.userId,
      'venue'
    );

    return updated;
  },

  async update_event(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      name: z.string().optional(),
      date: z.string().optional(),
      description: z.string().optional(),
      rsvp_deadline: z.string().optional(),
    });
    const validated = schema.parse(params);

    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { event_id, date, rsvp_deadline, ...otherUpdates } = validated;
    // Convert date strings to Date objects if provided
    const processedUpdates = {
      ...otherUpdates,
      ...(date ? { date: new Date(date) } : {}),
      ...(rsvp_deadline ? { rsvp_deadline: new Date(rsvp_deadline) } : {}),
    };
    const updated = await updateEvent(supabase, event_id, processedUpdates);
    return updated;
  },

  async add_element_to_event(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      element_id: z.string().uuid(),
      amount: z.number(),
      customization: z.string().optional(),
      notes: z.string().optional(),
    });
    const validated = schema.parse(params);

    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const result = await addElementToEvent(supabase, {
      ...validated,
      status: 'to-do',
      contract_completed: false,
    });

    return result;
  },

  async update_event_element_status(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_element_id: z.string().uuid(),
      new_status: z.enum(['to-do', 'in_progress', 'completed', 'needs_attention']),
    });
    const validated = schema.parse(params);

    // Verify ownership
    const { data: ee } = await supabase
      .from('event_elements')
      .select('event_id, events!inner(venue_id)')
      .eq('event_element_id', validated.event_element_id)
      .single();

    if (!ee || ee.events.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const updated = await changeEventElementStatus(
      supabase,
      validated.event_element_id,
      validated.new_status,
      context.userId,
      'venue'
    );

    return updated;
  },

  async update_event_element(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_element_id: z.string().uuid(),
      customization: z.string().optional(),
      amount: z.number().optional(),
      notes: z.string().optional(),
      contract_completed: z.boolean().optional(),
    });
    const validated = schema.parse(params);

    // Verify ownership
    const { data: ee } = await supabase
      .from('event_elements')
      .select('event_id, events!inner(venue_id)')
      .eq('event_element_id', validated.event_element_id)
      .single();

    if (!ee || ee.events.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { event_element_id, ...updates } = validated;
    const updated = await updateEventElement(supabase, event_element_id, updates);
    return updated;
  },

  async remove_element_from_event(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_element_id: z.string().uuid(),
      reason: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify ownership
    const { data: ee } = await supabase
      .from('event_elements')
      .select('event_id, events!inner(venue_id)')
      .eq('event_element_id', validated.event_element_id)
      .single();

    if (!ee || ee.events.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    await removeElementFromEvent(supabase, validated.event_element_id);
    return { success: true, reason: validated.reason };
  },

  async create_task(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      assigned_to_id: z.string().uuid(),
      assigned_to_type: z.enum(['client', 'venue', 'vendor']),
      name: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      due_date: z.string().optional(),
      form_schema: z.any().optional(),
    });
    const validated = schema.parse(params);

    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { due_date, ...otherFields } = validated;
    const task = await createTask(supabase, {
      ...otherFields,
      priority: validated.priority || 'medium',
      status: 'pending',
      created_by: context.userId,
      ...(due_date ? { due_date: new Date(due_date) } : {}),
    });

    return task;
  },

  async update_task(params, context) {
    const supabase = createClient();
    const schema = z.object({
      task_id: z.string().uuid(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      due_date: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify ownership through event
    const { data: task } = await supabase
      .from('tasks')
      .select('event_id, events!inner(venue_id)')
      .eq('task_id', validated.task_id)
      .single();

    if (!task || task.events.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { task_id, due_date, ...otherUpdates } = validated;
    const processedUpdates = {
      ...otherUpdates,
      ...(due_date ? { due_date: new Date(due_date) } : {}),
    };
    const updated = await updateTask(supabase, task_id, processedUpdates);
    return updated;
  },

  async complete_task(params, context) {
    const supabase = createClient();
    const schema = z.object({
      task_id: z.string().uuid(),
      form_response: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify ownership
    const { data: task } = await supabase
      .from('tasks')
      .select('event_id, events!inner(venue_id)')
      .eq('task_id', validated.task_id)
      .single();

    if (!task || task.events.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    // Parse form_response if it's a JSON string
    const formResponse = validated.form_response
      ? JSON.parse(validated.form_response)
      : undefined;

    const completed = await completeTask(
      supabase,
      validated.task_id,
      formResponse,
      context.userId,
      'venue'
    );

    return completed;
  },

  async add_guest(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid(),
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      dietary_restrictions: z.string().optional(),
    });
    const validated = schema.parse(params);

    const event = await getEvent(supabase, validated.event_id);
    if (!event || event.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const guest = await createGuest(supabase, {
      ...validated,
      rsvp_status: 'undecided',
      plus_one: false,
    });

    return guest;
  },

  async update_guest(params, context) {
    const supabase = createClient();
    const schema = z.object({
      guest_id: z.string().uuid(),
      rsvp_status: z.enum(['yes', 'no', 'undecided']).optional(),
      dietary_restrictions: z.string().optional(),
    });
    const validated = schema.parse(params);

    // Verify ownership
    const { data: guest } = await supabase
      .from('guests')
      .select('event_id, events!inner(venue_id)')
      .eq('guest_id', validated.guest_id)
      .single();

    if (!guest || guest.events.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const { guest_id, ...updates } = validated;
    const updated = await updateGuest(supabase, guest_id, updates);
    return updated;
  },

  async get_guest_statistics(params, context) {
    const supabase = createClient();
    const { event_id } = z.object({ event_id: z.string().uuid() }).parse(params);

    const event = await getEvent(supabase, event_id);
    if (!event || event.venue_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    const stats = await getGuestStats(supabase, event_id);
    return stats;
  },

  async send_message(params, context) {
    const supabase = createClient();
    const schema = z.object({
      event_id: z.string().uuid().optional(),
      recipient_id: z.string().uuid(),
      recipient_type: z.enum(['client', 'vendor']),
      content: z.string(),
      action_required: z.boolean().optional(),
    });
    const validated = schema.parse(params);

    if (validated.event_id) {
      const event = await getEvent(supabase, validated.event_id);
      if (!event || event.venue_id !== context.userId) {
        throw new Error('Unauthorized');
      }
    }

    const threadId = validated.event_id
      ? `event-${validated.event_id}`
      : `direct-${context.userId}-${validated.recipient_id}`;

    const message = await sendMessage(supabase, {
      thread_id: threadId,
      event_id: validated.event_id,
      sender_id: context.userId,
      sender_type: 'venue',
      recipient_id: validated.recipient_id,
      recipient_type: validated.recipient_type,
      content: validated.content,
      attachments: [],
      action_required: validated.action_required || false,
      read: false,
    });

    return message;
  },

  async mark_message_as_read(params, context) {
    const supabase = createClient();
    const { message_id } = z.object({ message_id: z.string().uuid() }).parse(params);

    await markMessageAsRead(supabase, message_id);
    return { success: true };
  },
};

/**
 * VENDOR TOOL HANDLERS
 */

export const vendorToolHandlers: Record<string, ToolHandler> = {
  async get_task_details(params, context) {
    const supabase = createClient();
    const { task_id } = z.object({ task_id: z.string().uuid() }).parse(params);

    const task = await getTask(supabase, task_id);
    if (!task || task.assigned_to_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    return task;
  },

  async complete_task(params, context) {
    const supabase = createClient();
    const schema = z.object({
      task_id: z.string().uuid(),
      form_response: z.string().optional(),
    });
    const validated = schema.parse(params);

    const task = await getTask(supabase, validated.task_id);
    if (!task || task.assigned_to_id !== context.userId) {
      throw new Error('Unauthorized');
    }

    // Parse form_response if it's a JSON string
    const formResponse = validated.form_response
      ? JSON.parse(validated.form_response)
      : undefined;

    const completed = await completeTask(
      supabase,
      validated.task_id,
      formResponse,
      context.userId,
      'vendor'
    );

    return completed;
  },

  async send_message_to_venue(params, context) {
    const supabase = createClient();
    const schema = z.object({
      thread_id: z.string(),
      content: z.string(),
    });
    const validated = schema.parse(params);

    // Get thread to find venue
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, sender_type, recipient_type')
      .eq('thread_id', validated.thread_id)
      .limit(1);

    if (!existingMessages || existingMessages.length === 0) {
      throw new Error('Thread not found');
    }

    const firstMessage = existingMessages[0];
    const venueId = firstMessage.sender_type === 'venue'
      ? firstMessage.sender_id
      : firstMessage.recipient_id;

    const message = await sendMessage(supabase, {
      thread_id: validated.thread_id,
      sender_id: context.userId,
      sender_type: 'vendor',
      recipient_id: venueId,
      recipient_type: 'venue',
      content: validated.content,
      attachments: [],
      action_required: false,
      read: false,
    });

    return message;
  },

  async mark_message_as_read(params, context) {
    const supabase = createClient();
    const { message_id } = z.object({ message_id: z.string().uuid() }).parse(params);

    await markMessageAsRead(supabase, message_id);
    return { success: true };
  },
};

/**
 * Execute a tool call with proper error handling
 */
export async function executeToolCall(
  toolName: string,
  params: any,
  context: { userId: string; userType: 'client' | 'venue' | 'vendor' },
  agentType: 'client' | 'venue_general' | 'venue_event' | 'vendor'
): Promise<any> {
  try {
    let handler;

    switch (agentType) {
      case 'client':
        handler = clientToolHandlers[toolName];
        break;
      case 'venue_general':
        handler = venueGeneralToolHandlers[toolName];
        break;
      case 'venue_event':
        handler = venueEventToolHandlers[toolName];
        break;
      case 'vendor':
        handler = vendorToolHandlers[toolName];
        break;
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    if (!handler) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const result = await handler(params, context);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
