/**
 * Space CRUD Operations
 *
 * This module provides database operations for spaces within venues.
 * All functions are designed to be callable by LLM agents as tools.
 */

import { supabase } from './supabaseClient';
import {
  SpaceSchema,
  CreateSpaceSchema,
  UpdateSpaceSchema,
  type Space,
  type CreateSpace,
  type UpdateSpace,
} from '../schemas';

/**
 * Get a space by ID
 *
 * @param space_id - The UUID of the space to retrieve
 * @returns The space object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const space = await getSpace('space-uuid');
 */
export async function getSpace(space_id: string): Promise<Space | null> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('space_id', space_id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch space: ${error.message}`);
  }

  return SpaceSchema.parse(data);
}

/**
 * List spaces for a venue
 *
 * @param venue_id - The UUID of the venue
 * @returns Array of spaces
 * @throws {Error} If the database query fails
 *
 * @example
 * const spaces = await listSpaces('venue-uuid');
 */
export async function listSpaces(venue_id: string): Promise<Space[]> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('venue_id', venue_id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to list spaces: ${error.message}`);
  }

  return data?.map((space) => SpaceSchema.parse(space)) || [];
}

/**
 * Create a new space
 *
 * @param space - The space data to create
 * @returns The created space object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const newSpace = await createSpace({
 *   venue_id: 'venue-uuid',
 *   name: 'Grand Ballroom',
 *   description: 'Our largest event space',
 *   capacity: 300,
 *   main_image_url: 'https://...',
 *   photos: [
 *     { url: 'https://...', caption: 'Main view', order: 0 }
 *   ]
 * });
 */
export async function createSpace(space: CreateSpace): Promise<Space> {
  // Validate input
  const validated = CreateSpaceSchema.parse(space);

  const { data, error } = await supabase
    .from('spaces')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create space: ${error.message}`);
  }

  return SpaceSchema.parse(data);
}

/**
 * Update an existing space
 *
 * @param space_id - The UUID of the space to update
 * @param updates - The fields to update
 * @returns The updated space object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateSpace('space-uuid', {
 *   capacity: 350,
 *   description: 'Expanded capacity after renovation'
 * });
 */
export async function updateSpace(
  space_id: string,
  updates: UpdateSpace
): Promise<Space> {
  // Validate input
  const validated = UpdateSpaceSchema.parse(updates);

  const { data, error } = await supabase
    .from('spaces')
    .update(validated)
    .eq('space_id', space_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update space: ${error.message}`);
  }

  return SpaceSchema.parse(data);
}

/**
 * Soft delete a space (sets deleted_at timestamp)
 *
 * @param space_id - The UUID of the space to delete
 * @returns True if successful
 * @throws {Error} If database update fails
 *
 * @example
 * await deleteSpace('space-uuid');
 */
export async function deleteSpace(space_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('spaces')
    .update({ deleted_at: new Date().toISOString() })
    .eq('space_id', space_id);

  if (error) {
    throw new Error(`Failed to delete space: ${error.message}`);
  }

  return true;
}

/**
 * Add photos to a space
 *
 * Appends new photos to the existing photos array.
 *
 * @param space_id - The UUID of the space
 * @param photos - Array of photos to add
 * @returns The updated space object
 * @throws {Error} If update fails
 *
 * @example
 * await addSpacePhotos('space-uuid', [
 *   { url: 'https://...', caption: 'Night view', order: 2 }
 * ]);
 */
export async function addSpacePhotos(
  space_id: string,
  photos: Array<{ url: string; caption?: string; order: number }>
): Promise<Space> {
  const space = await getSpace(space_id);
  if (!space) {
    throw new Error('Space not found');
  }

  const currentPhotos = space.photos || [];
  const updatedPhotos = [...currentPhotos, ...photos];

  return updateSpace(space_id, { photos: updatedPhotos });
}

/**
 * Remove a photo from a space
 *
 * @param space_id - The UUID of the space
 * @param photo_url - The URL of the photo to remove
 * @returns The updated space object
 * @throws {Error} If update fails
 *
 * @example
 * await removeSpacePhoto('space-uuid', 'https://old-photo.jpg');
 */
export async function removeSpacePhoto(
  space_id: string,
  photo_url: string
): Promise<Space> {
  const space = await getSpace(space_id);
  if (!space) {
    throw new Error('Space not found');
  }

  const currentPhotos = space.photos || [];
  const updatedPhotos = currentPhotos.filter((photo: any) => photo.url !== photo_url);

  return updateSpace(space_id, { photos: updatedPhotos });
}

/**
 * Check space availability for a date
 *
 * Returns true if the space has no events on the given date.
 *
 * @param space_id - The UUID of the space
 * @param date - The date to check (ISO 8601 format)
 * @returns True if available, false if booked
 * @throws {Error} If database query fails
 *
 * @example
 * const available = await checkSpaceAvailability('space-uuid', '2025-06-15T14:00:00Z');
 */
export async function checkSpaceAvailability(
  space_id: string,
  date: string
): Promise<boolean> {
  const checkDate = new Date(date);
  const dayStart = new Date(checkDate.setHours(0, 0, 0, 0)).toISOString();
  const dayEnd = new Date(checkDate.setHours(23, 59, 59, 999)).toISOString();

  const { count, error } = await supabase
    .from('event_spaces')
    .select('*, events!inner(date)', { count: 'exact', head: true })
    .eq('space_id', space_id)
    .gte('events.date', dayStart)
    .lte('events.date', dayEnd);

  if (error) {
    throw new Error(`Failed to check space availability: ${error.message}`);
  }

  return (count || 0) === 0;
}

/**
 * Get upcoming events for a space
 *
 * @param space_id - The UUID of the space
 * @param limit - Maximum number of events to return (default: 10)
 * @returns Array of events using this space
 * @throws {Error} If database query fails
 *
 * @example
 * const upcomingEvents = await getSpaceUpcomingEvents('space-uuid');
 */
export async function getSpaceUpcomingEvents(
  space_id: string,
  limit: number = 10
): Promise<any[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('event_spaces')
    .select('*, events!inner(*)')
    .eq('space_id', space_id)
    .gte('events.date', now)
    .is('events.deleted_at', null)
    .order('events.date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get space upcoming events: ${error.message}`);
  }

  return data?.map((item) => item.events) || [];
}
