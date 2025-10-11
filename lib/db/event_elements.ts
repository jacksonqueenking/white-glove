/**
 * Event Element CRUD Operations
 *
 * This module provides database operations for event elements (elements assigned to events).
 * All functions are designed to be callable by LLM agents as tools.
 */

import { supabase, supabaseAdmin } from './supabaseClient';
import {
  EventElementSchema,
  CreateEventElementSchema,
  UpdateEventElementSchema,
  type EventElement,
  type CreateEventElement,
  type UpdateEventElement,
  type ElementStatus,
} from '../schemas';

/**
 * Get an event element by ID
 *
 * @param event_element_id - The UUID of the event element to retrieve
 * @returns The event element object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const eventElement = await getEventElement('event-element-uuid');
 */
export async function getEventElement(event_element_id: string): Promise<EventElement | null> {
  const { data, error } = await supabase
    .from('event_elements')
    .select('*')
    .eq('event_element_id', event_element_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch event element: ${error.message}`);
  }

  return EventElementSchema.parse(data);
}

/**
 * List event elements for an event
 *
 * @param event_id - The UUID of the event
 * @param status - Optional: filter by status
 * @returns Array of event elements with element details
 * @throws {Error} If the database query fails
 *
 * @example
 * const allElements = await listEventElements('event-uuid');
 * const needsAttention = await listEventElements('event-uuid', 'needs_attention');
 */
export async function listEventElements(
  event_id: string,
  status?: ElementStatus
): Promise<any[]> {
  let query = supabase
    .from('event_elements')
    .select('*, elements(*)')
    .eq('event_id', event_id);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list event elements: ${error.message}`);
  }

  return data || [];
}

/**
 * Add an element to an event
 *
 * Creates an event_element record linking an element to an event.
 *
 * @param event_element - The event element data to create
 * @returns The created event element object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const eventElement = await addElementToEvent({
 *   event_id: 'event-uuid',
 *   element_id: 'element-uuid',
 *   amount: 2500.00,
 *   status: 'to-do',
 *   customization: 'Pink and white color scheme'
 * });
 */
export async function addElementToEvent(
  event_element: CreateEventElement
): Promise<EventElement> {
  // Validate input
  const validated = CreateEventElementSchema.parse(event_element);

  const { data, error } = await supabase
    .from('event_elements')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add element to event: ${error.message}`);
  }

  // Log the action
  await supabaseAdmin.from('action_history').insert({
    event_id: validated.event_id,
    action_type: 'element_added',
    description: `Element added to event`,
    metadata: { event_element_id: data.event_element_id, element_id: validated.element_id },
  });

  return EventElementSchema.parse(data);
}

/**
 * Update an event element
 *
 * @param event_element_id - The UUID of the event element to update
 * @param updates - The fields to update
 * @returns The updated event element object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateEventElement('event-element-uuid', {
 *   status: 'completed',
 *   contract_completed: true
 * });
 */
export async function updateEventElement(
  event_element_id: string,
  updates: UpdateEventElement
): Promise<EventElement> {
  // Validate input
  const validated = UpdateEventElementSchema.parse(updates);

  const { data, error } = await supabase
    .from('event_elements')
    .update(validated)
    .eq('event_element_id', event_element_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update event element: ${error.message}`);
  }

  return EventElementSchema.parse(data);
}

/**
 * Remove an element from an event
 *
 * Deletes the event_element record.
 *
 * @param event_element_id - The UUID of the event element to delete
 * @returns True if successful
 * @throws {Error} If database delete fails
 *
 * @example
 * await removeElementFromEvent('event-element-uuid');
 */
export async function removeElementFromEvent(event_element_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_elements')
    .delete()
    .eq('event_element_id', event_element_id);

  if (error) {
    throw new Error(`Failed to remove element from event: ${error.message}`);
  }

  return true;
}

/**
 * Change event element status
 *
 * Updates the status and logs the change to action_history.
 *
 * @param event_element_id - The UUID of the event element
 * @param new_status - The new status
 * @param user_id - The ID of the user making the change
 * @param user_type - The type of user making the change
 * @returns The updated event element
 * @throws {Error} If update fails
 *
 * @example
 * await changeEventElementStatus('event-element-uuid', 'completed', 'user-uuid', 'venue');
 */
export async function changeEventElementStatus(
  event_element_id: string,
  new_status: ElementStatus,
  user_id: string,
  user_type: 'client' | 'venue' | 'vendor' | 'system'
): Promise<EventElement> {
  const eventElement = await getEventElement(event_element_id);
  if (!eventElement) {
    throw new Error('Event element not found');
  }

  const updated = await updateEventElement(event_element_id, { status: new_status });

  // Log the action
  await supabaseAdmin.from('action_history').insert({
    event_id: eventElement.event_id,
    user_id,
    user_type,
    action_type: 'element_status_changed',
    description: `Element status changed to ${new_status}`,
    metadata: {
      event_element_id,
      previous_status: eventElement.status,
      new_status,
    },
  });

  return updated;
}

/**
 * Get event elements by status
 *
 * @param event_id - The UUID of the event
 * @param status - The status to filter by
 * @returns Array of event elements
 * @throws {Error} If database query fails
 *
 * @example
 * const needsAttention = await getEventElementsByStatus('event-uuid', 'needs_attention');
 */
export async function getEventElementsByStatus(
  event_id: string,
  status: ElementStatus
): Promise<EventElement[]> {
  const { data, error } = await supabase
    .from('event_elements')
    .select('*')
    .eq('event_id', event_id)
    .eq('status', status);

  if (error) {
    throw new Error(`Failed to get event elements by status: ${error.message}`);
  }

  return data?.map((ee) => EventElementSchema.parse(ee)) || [];
}

/**
 * Get event element totals
 *
 * Calculates the total cost of all elements for an event.
 *
 * @param event_id - The UUID of the event
 * @returns Object with total amounts
 * @throws {Error} If database query fails
 *
 * @example
 * const totals = await getEventElementTotals('event-uuid');
 * // { total: 15000, completed: 10000, pending: 5000 }
 */
export async function getEventElementTotals(event_id: string): Promise<{
  total: number;
  completed: number;
  pending: number;
}> {
  const { data, error } = await supabase
    .from('event_elements')
    .select('amount, status')
    .eq('event_id', event_id);

  if (error) {
    throw new Error(`Failed to get event element totals: ${error.message}`);
  }

  const totals = {
    total: 0,
    completed: 0,
    pending: 0,
  };

  data?.forEach((ee) => {
    totals.total += ee.amount || 0;
    if (ee.status === 'completed') {
      totals.completed += ee.amount || 0;
    } else {
      totals.pending += ee.amount || 0;
    }
  });

  return totals;
}

/**
 * Update event element contract status
 *
 * Marks the contract as completed for an event element.
 *
 * @param event_element_id - The UUID of the event element
 * @param completed - Whether the contract is completed
 * @returns The updated event element
 * @throws {Error} If update fails
 *
 * @example
 * await updateEventElementContract('event-element-uuid', true);
 */
export async function updateEventElementContract(
  event_element_id: string,
  completed: boolean
): Promise<EventElement> {
  return updateEventElement(event_element_id, { contract_completed: completed });
}
