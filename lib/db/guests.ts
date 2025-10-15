/**
 * Guest CRUD Operations
 *
 * This module provides database operations for event guests.
 * All functions are designed to be callable by LLM agents as tools.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import {
  GuestSchema,
  CreateGuestSchema,
  UpdateGuestSchema,
  type Guest,
  type CreateGuest,
  type UpdateGuest,
  type RSVPStatus,
} from '../schemas';

/**
 * Get a guest by ID
 *
 * @param supabase - Supabase client instance
 * @param guest_id - The UUID of the guest to retrieve
 * @returns The guest object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const guest = await getGuest(supabase, 'guest-uuid');
 */
export async function getGuest(supabase: SupabaseClient<Database>, guest_id: string): Promise<Guest | null> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('guest_id', guest_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch guest: ${error.message}`);
  }

  return GuestSchema.parse(data);
}

/**
 * List guests for an event
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @param rsvp_status - Optional: filter by RSVP status
 * @returns Array of guests
 * @throws {Error} If the database query fails
 *
 * @example
 * const guests = await listGuests(supabase, 'event-uuid');
 * const confirmed = await listGuests(supabase, 'event-uuid', 'yes');
 */
export async function listGuests(
  supabase: SupabaseClient<Database>,
  event_id: string,
  rsvp_status?: RSVPStatus
): Promise<Guest[]> {
  let query = supabase
    .from('guests')
    .select('*')
    .eq('event_id', event_id)
    .order('name', { ascending: true });

  if (rsvp_status) {
    query = query.eq('rsvp_status', rsvp_status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list guests: ${error.message}`);
  }

  return data?.map((guest: any) => GuestSchema.parse(guest)) || [];
}

/**
 * Create a new guest
 *
 * @param supabase - Supabase client instance
 * @param guest - The guest data to create
 * @returns The created guest object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const guest = await createGuest(supabase, {
 *   event_id: 'event-uuid',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   rsvp_status: 'undecided'
 * });
 */
export async function createGuest(supabase: SupabaseClient<Database>, guest: CreateGuest): Promise<Guest> {
  // Validate input
  const validated = CreateGuestSchema.parse(guest);

  const { data, error } = await supabase
    .from('guests')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create guest: ${error.message}`);
  }

  return GuestSchema.parse(data);
}

/**
 * Create multiple guests at once
 *
 * Useful for bulk importing guests.
 *
 * @param supabase - Supabase client instance
 * @param guests - Array of guest data to create
 * @returns Array of created guest objects
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const guests = await bulkCreateGuests(supabase, [
 *   { event_id: 'event-uuid', name: 'John Doe', email: 'john@example.com' },
 *   { event_id: 'event-uuid', name: 'Jane Smith', email: 'jane@example.com' }
 * ]);
 */
export async function bulkCreateGuests(supabase: SupabaseClient<Database>, guests: CreateGuest[]): Promise<Guest[]> {
  // Validate all inputs
  const validated = guests.map((guest: any) => CreateGuestSchema.parse(guest));

  const { data, error } = await supabase
    .from('guests')
    .insert(validated)
    .select();

  if (error) {
    throw new Error(`Failed to create guests: ${error.message}`);
  }

  return data?.map((guest: any) => GuestSchema.parse(guest)) || [];
}

/**
 * Update an existing guest
 *
 * @param supabase - Supabase client instance
 * @param guest_id - The UUID of the guest to update
 * @param updates - The fields to update
 * @returns The updated guest object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateGuest(supabase, 'guest-uuid', {
 *   rsvp_status: 'yes',
 *   dietary_restrictions: 'Vegetarian'
 * });
 */
export async function updateGuest(
  supabase: SupabaseClient<Database>,
  guest_id: string,
  updates: UpdateGuest
): Promise<Guest> {
  // Validate input
  const validated = UpdateGuestSchema.parse(updates);

  const { data, error } = await supabase
    .from('guests')
    .update(validated)
    .eq('guest_id', guest_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update guest: ${error.message}`);
  }

  return GuestSchema.parse(data);
}

/**
 * Delete a guest
 *
 * @param supabase - Supabase client instance
 * @param guest_id - The UUID of the guest to delete
 * @returns True if successful
 * @throws {Error} If database delete fails
 *
 * @example
 * await deleteGuest(supabase, 'guest-uuid');
 */
export async function deleteGuest(supabase: SupabaseClient<Database>, guest_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('guest_id', guest_id);

  if (error) {
    throw new Error(`Failed to delete guest: ${error.message}`);
  }

  return true;
}

/**
 * Get guest count statistics for an event
 *
 * Returns counts by RSVP status and total expected attendance.
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @returns Object with guest statistics
 * @throws {Error} If database query fails
 *
 * @example
 * const stats = await getGuestStats(supabase, 'event-uuid');
 * // Returns: { total: 150, yes: 120, no: 10, undecided: 20, expected_attendance: 130 }
 */
export async function getGuestStats(supabase: SupabaseClient<Database>, event_id: string): Promise<{
  total: number;
  yes: number;
  no: number;
  undecided: number;
  expected_attendance: number; // yes + plus_ones
}> {
  const { data, error } = await supabase
    .from('guests')
    .select('rsvp_status, plus_one')
    .eq('event_id', event_id);

  if (error) {
    throw new Error(`Failed to get guest stats: ${error.message}`);
  }

  const stats = {
    total: data?.length || 0,
    yes: 0,
    no: 0,
    undecided: 0,
    expected_attendance: 0,
  };

  data?.forEach((guest: any) => {
    if (guest.rsvp_status === 'yes') {
      stats.yes++;
      stats.expected_attendance++; // Count the guest
      if (guest.plus_one) {
        stats.expected_attendance++; // Count the plus one
      }
    } else if (guest.rsvp_status === 'no') {
      stats.no++;
    } else {
      stats.undecided++;
    }
  });

  return stats;
}

/**
 * Get guests with dietary restrictions
 *
 * Returns all guests for an event who have specified dietary restrictions.
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @returns Array of guests with dietary restrictions
 * @throws {Error} If database query fails
 *
 * @example
 * const specialDiets = await getGuestsWithDietaryRestrictions(supabase, 'event-uuid');
 */
export async function getGuestsWithDietaryRestrictions(
  supabase: SupabaseClient<Database>,
  event_id: string
): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', event_id)
    .not('dietary_restrictions', 'is', null)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to get guests with dietary restrictions: ${error.message}`);
  }

  return data?.map((guest: any) => GuestSchema.parse(guest)) || [];
}

/**
 * Search guests by name or email
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @param search_term - The search term (matches name or email)
 * @returns Array of matching guests
 * @throws {Error} If database query fails
 *
 * @example
 * const results = await searchGuests(supabase, 'event-uuid', 'john');
 */
export async function searchGuests(
  supabase: SupabaseClient<Database>,
  event_id: string,
  search_term: string
): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', event_id)
    .or(`name.ilike.%${search_term}%,email.ilike.%${search_term}%`)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to search guests: ${error.message}`);
  }

  return data?.map((guest: any) => GuestSchema.parse(guest)) || [];
}
