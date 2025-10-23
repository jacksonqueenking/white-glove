/**
 * Event CRUD Operations
 *
 * This module provides database operations for events.
 * All functions are designed to be callable by LLM agents as tools.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import {
  EventSchema,
  CreateEventSchema,
  UpdateEventSchema,
  type Event,
  type CreateEvent,
  type UpdateEvent,
  type EventStatus,
} from '../schemas';

/**
 * Get an event by ID
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event to retrieve
 * @returns The event object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const event = await getEvent(supabase, '123e4567-e89b-12d3-a456-426614174000');
 */
export async function getEvent(
  supabase: SupabaseClient<Database>,
  event_id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_id', event_id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  return EventSchema.parse(data);
}

/**
 * List events with optional filtering
 *
 * @param supabase - Supabase client instance
 * @param params - Filter parameters
 * @param params.client_id - Filter by client ID
 * @param params.venue_id - Filter by venue ID
 * @param params.status - Filter by event status
 * @param params.limit - Maximum number of events to return (default: 50)
 * @param params.offset - Number of events to skip (for pagination)
 * @returns Array of events
 * @throws {Error} If the database query fails
 *
 * @example
 * const events = await listEvents(supabase, { venue_id: 'abc123', status: 'confirmed' });
 */
export async function listEvents(
  supabase: SupabaseClient<Database>,
  params?: {
    client_id?: string;
    venue_id?: string;
    status?: EventStatus;
    limit?: number;
    offset?: number;
  }
): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .is('deleted_at', null)
    .order('date', { ascending: true });

  if (params?.client_id) {
    query = query.eq('client_id', params.client_id);
  }

  if (params?.venue_id) {
    query = query.eq('venue_id', params.venue_id);
  }

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list events: ${error.message}`);
  }

  return data?.map((event: any) => EventSchema.parse(event)) || [];
}

/**
 * Create a new event
 *
 * @param supabase - Supabase client instance
 * @param event - The event data to create
 * @returns The created event object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const newEvent = await createEvent(supabase, {
 *   name: 'Birthday Party',
 *   date: '2025-06-15T14:00:00Z',
 *   venue_id: 'venue-uuid',
 *   status: 'inquiry'
 * });
 */
export async function createEvent(
  supabase: SupabaseClient<Database>,
  event: CreateEvent
): Promise<Event> {
  // Validate input
  const validated = CreateEventSchema.parse(event);

  // Convert Date objects to ISO strings for database storage
  const dbData = {
    ...validated,
    date: validated.date.toISOString(),
    rsvp_deadline: validated.rsvp_deadline?.toISOString(),
    calendar: validated.calendar ? {
      date: validated.calendar.date.toISOString(),
      timeline: validated.calendar.timeline,
    } : null,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }

  return EventSchema.parse(data);
}

/**
 * Update an existing event
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event to update
 * @param updates - The fields to update
 * @returns The updated event object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateEvent(supabase, 'event-uuid', {
 *   status: 'confirmed',
 *   rsvp_deadline: '2025-06-01'
 * });
 */
export async function updateEvent(
  supabase: SupabaseClient<Database>,
  event_id: string,
  updates: UpdateEvent
): Promise<Event> {
  // Validate input
  const validated = UpdateEventSchema.parse(updates);

  // Convert Date objects to ISO strings for database storage
  const dbData: any = { ...validated };
  if (validated.date) {
    dbData.date = validated.date.toISOString();
  }
  if (validated.rsvp_deadline !== undefined) {
    dbData.rsvp_deadline = validated.rsvp_deadline?.toISOString();
  }
  if (validated.calendar) {
    dbData.calendar = {
      date: validated.calendar.date.toISOString(),
      timeline: validated.calendar.timeline,
    };
  }

  const { data, error } = await supabase
    .from('events')
    .update(dbData)
    .eq('event_id', event_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }

  return EventSchema.parse(data);
}

/**
 * Soft delete an event (sets deleted_at timestamp)
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event to delete
 * @returns True if successful
 * @throws {Error} If database update fails
 *
 * @example
 * await deleteEvent(supabase, 'event-uuid');
 */
export async function deleteEvent(
  supabase: SupabaseClient<Database>,
  event_id: string
): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('event_id', event_id);

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }

  return true;
}

/**
 * Change event status
 *
 * This is a convenience function for the common operation of updating event status.
 * It also logs the status change to action_history.
 * Note: Requires admin privileges to write to action_history.
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @param new_status - The new status for the event
 * @param user_id - The ID of the user making the change
 * @param user_type - The type of user making the change
 * @returns The updated event
 * @throws {Error} If status update fails
 *
 * @example
 * await changeEventStatus(supabase, 'event-uuid', 'confirmed', 'user-uuid', 'venue');
 */
export async function changeEventStatus(
  supabase: SupabaseClient<Database>,
  event_id: string,
  new_status: EventStatus,
  user_id: string,
  user_type: 'client' | 'venue' | 'vendor' | 'system'
): Promise<Event> {
  // Update the event
  const updatedEvent = await updateEvent(supabase, event_id, { status: new_status });

  // Log the action (using admin client to bypass RLS)
  await supabase.from('action_history').insert({
    event_id,
    user_id,
    user_type,
    action_type: 'event_status_changed',
    description: `Event status changed to ${new_status}`,
    metadata: { previous_status: updatedEvent.status, new_status },
  });

  return updatedEvent;
}

/**
 * Get events happening within a date range
 *
 * @param supabase - Supabase client instance
 * @param start_date - Start of date range (ISO 8601 format)
 * @param end_date - End of date range (ISO 8601 format)
 * @param venue_id - Optional: filter by specific venue
 * @returns Array of events in the date range
 * @throws {Error} If database query fails
 *
 * @example
 * const juneEvents = await getEventsByDateRange(supabase, '2025-06-01', '2025-06-30', 'venue-uuid');
 */
export async function getEventsByDateRange(
  supabase: SupabaseClient<Database>,
  start_date: string,
  end_date: string,
  venue_id?: string
): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .is('deleted_at', null)
    .gte('date', start_date)
    .lte('date', end_date)
    .order('date', { ascending: true });

  if (venue_id) {
    query = query.eq('venue_id', venue_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch events by date range: ${error.message}`);
  }

  return data?.map((event: any) => EventSchema.parse(event)) || [];
}

/**
 * Add spaces to an event
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @param space_ids - Array of space UUIDs to add to the event
 * @returns True if successful
 * @throws {Error} If database insert fails
 *
 * @example
 * await addSpacesToEvent(supabase, 'event-uuid', ['space-1-uuid', 'space-2-uuid']);
 */
export async function addSpacesToEvent(
  supabase: SupabaseClient<Database>,
  event_id: string,
  space_ids: string[]
): Promise<boolean> {
  const inserts = space_ids.map((space_id: any) => ({
    event_id,
    space_id,
  }));

  const { error } = await supabase.from('event_spaces').insert(inserts);

  if (error) {
    throw new Error(`Failed to add spaces to event: ${error.message}`);
  }

  return true;
}

/**
 * Remove a space from an event
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @param space_id - The UUID of the space to remove
 * @returns True if successful
 * @throws {Error} If database delete fails
 *
 * @example
 * await removeSpaceFromEvent(supabase, 'event-uuid', 'space-uuid');
 */
export async function removeSpaceFromEvent(
  supabase: SupabaseClient<Database>,
  event_id: string,
  space_id: string
): Promise<boolean> {
  const { error } = await supabase
    .from('event_spaces')
    .delete()
    .eq('event_id', event_id)
    .eq('space_id', space_id);

  if (error) {
    throw new Error(`Failed to remove space from event: ${error.message}`);
  }

  return true;
}

/**
 * Get all spaces for an event
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @returns Array of space IDs
 * @throws {Error} If database query fails
 *
 * @example
 * const spaceIds = await getEventSpaces(supabase, 'event-uuid');
 */
export async function getEventSpaces(
  supabase: SupabaseClient<Database>,
  event_id: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_spaces')
    .select('space_id')
    .eq('event_id', event_id);

  if (error) {
    throw new Error(`Failed to get event spaces: ${error.message}`);
  }

  return data?.map((row: any) => row.space_id) || [];
}
