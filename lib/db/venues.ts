/**
 * Venue CRUD Operations
 *
 * This module provides database operations for venues.
 * All functions are designed to be callable by LLM agents as tools.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import {
  VenueSchema,
  CreateVenueSchema,
  UpdateVenueSchema,
  type Venue,
  type CreateVenue,
  type UpdateVenue,
} from '../schemas';

/**
 * Get a venue by ID
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue to retrieve
 * @returns The venue object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const venue = await getVenue(supabase, 'venue-uuid');
 */
export async function getVenue(
  supabase: SupabaseClient<Database>,
  venue_id: string
): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('venue_id', venue_id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch venue: ${error.message}`);
  }

  return VenueSchema.parse(data);
}

/**
 * List all venues
 *
 * @param supabase - Supabase client instance
 * @param params - Filter parameters
 * @param params.limit - Maximum number of venues to return (default: 50)
 * @param params.offset - Number of venues to skip (for pagination)
 * @returns Array of venues
 * @throws {Error} If the database query fails
 *
 * @example
 * const venues = await listVenues(supabase, { limit: 10 });
 */
export async function listVenues(
  supabase: SupabaseClient<Database>,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<Venue[]> {
  let query = supabase
    .from('venues')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list venues: ${error.message}`);
  }

  return data?.map((venue: any) => VenueSchema.parse(venue)) || [];
}

/**
 * Create a new venue
 *
 * This should be called after a venue user signs up via Supabase Auth.
 * The venue_id should match the auth.users.id.
 * Note: This function requires admin privileges (service role key).
 *
 * @param supabase - Supabase client instance (must be admin/service role client)
 * @param venue - The venue data to create
 * @returns The created venue object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const newVenue = await createVenue(supabaseAdmin, {
 *   venue_id: authUser.id,
 *   name: 'The Grand Ballroom',
 *   description: 'Elegant event space in downtown',
 *   address: {
 *     street: '456 Oak Ave',
 *     city: 'San Francisco',
 *     state: 'CA',
 *     zip: '94102',
 *     country: 'USA'
 *   }
 * });
 */
export async function createVenue(
  supabase: SupabaseClient<Database>,
  venue: CreateVenue
): Promise<Venue> {
  // Validate input
  const validated = CreateVenueSchema.parse(venue);

  const { data, error } = await supabase
    .from('venues')
    .insert(validated as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create venue: ${error.message}`);
  }

  return VenueSchema.parse(data);
}

/**
 * Update an existing venue
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue to update
 * @param updates - The fields to update
 * @returns The updated venue object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateVenue(supabase, 'venue-uuid', {
 *   description: 'Updated description with new amenities'
 * });
 */
export async function updateVenue(
  supabase: SupabaseClient<Database>,
  venue_id: string,
  updates: UpdateVenue
): Promise<Venue> {
  // Validate input
  const validated = UpdateVenueSchema.parse(updates);

  const { data, error } = await supabase
    .from('venues')
    .update(validated)
    .eq('venue_id', venue_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update venue: ${error.message}`);
  }

  return VenueSchema.parse(data);
}

/**
 * Soft delete a venue (sets deleted_at timestamp)
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue to delete
 * @returns True if successful
 * @throws {Error} If database update fails
 *
 * @example
 * await deleteVenue(supabase, 'venue-uuid');
 */
export async function deleteVenue(
  supabase: SupabaseClient<Database>,
  venue_id: string
): Promise<boolean> {
  const { error } = await supabase
    .from('venues')
    .update({ deleted_at: new Date().toISOString() })
    .eq('venue_id', venue_id);

  if (error) {
    throw new Error(`Failed to delete venue: ${error.message}`);
  }

  return true;
}

/**
 * Get total number of events for a venue
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue
 * @param status - Optional: filter by event status
 * @returns Count of events
 * @throws {Error} If database query fails
 *
 * @example
 * const totalEvents = await getVenueEventCount(supabase, 'venue-uuid');
 * const confirmedEvents = await getVenueEventCount(supabase, 'venue-uuid', 'confirmed');
 */
export async function getVenueEventCount(
  supabase: SupabaseClient<Database>,
  venue_id: string,
  status?: string
): Promise<number> {
  let query = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue_id)
    .is('deleted_at', null);

  if (status) {
    query = query.eq('status', status);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to get venue event count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get total number of spaces for a venue
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue
 * @returns Count of spaces
 * @throws {Error} If database query fails
 *
 * @example
 * const spaceCount = await getVenueSpaceCount(supabase, 'venue-uuid');
 */
export async function getVenueSpaceCount(
  supabase: SupabaseClient<Database>,
  venue_id: string
): Promise<number> {
  const { count, error } = await supabase
    .from('spaces')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue_id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to get venue space count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get venue statistics
 *
 * Returns counts of events, spaces, and vendors.
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue
 * @returns Object with venue statistics
 * @throws {Error} If database query fails
 *
 * @example
 * const stats = await getVenueStats(supabase, 'venue-uuid');
 * // { total_events: 50, upcoming_events: 10, spaces: 5, vendors: 15 }
 */
export async function getVenueStats(
  supabase: SupabaseClient<Database>,
  venue_id: string
): Promise<{
  total_events: number;
  upcoming_events: number;
  spaces: number;
  vendors: number;
}> {
  const now = new Date().toISOString();

  // Get total events
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue_id)
    .is('deleted_at', null);

  // Get upcoming events
  const { count: upcomingEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue_id)
    .gte('date', now)
    .is('deleted_at', null);

  // Get spaces count
  const { count: spaces } = await supabase
    .from('spaces')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue_id)
    .is('deleted_at', null);

  // Get vendors count
  const { count: vendors } = await supabase
    .from('venue_vendors')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue_id)
    .eq('approval_status', 'approved');

  return {
    total_events: totalEvents || 0,
    upcoming_events: upcomingEvents || 0,
    spaces: spaces || 0,
    vendors: vendors || 0,
  };
}

/**
 * Search venues by name or location
 *
 * @param supabase - Supabase client instance
 * @param search_term - The search term (matches name, city, or state)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching venues
 * @throws {Error} If database query fails
 *
 * @example
 * const results = await searchVenues(supabase, 'grand');
 * const sfVenues = await searchVenues(supabase, 'san francisco');
 */
export async function searchVenues(
  supabase: SupabaseClient<Database>,
  search_term: string,
  limit: number = 20
): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .is('deleted_at', null)
    .or(`name.ilike.%${search_term}%,address->>city.ilike.%${search_term}%,address->>state.ilike.%${search_term}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search venues: ${error.message}`);
  }

  return data?.map((venue: any) => VenueSchema.parse(venue)) || [];
}
