/**
 * Element CRUD Operations
 *
 * This module provides database operations for elements (services/products).
 * All functions are designed to be callable by LLM agents as tools.
 */

import { supabase } from './supabaseClient';
import {
  ElementSchema,
  CreateElementSchema,
  UpdateElementSchema,
  type Element,
  type CreateElement,
  type UpdateElement,
} from '../schemas';

/**
 * Get an element by ID
 *
 * @param element_id - The UUID of the element to retrieve
 * @returns The element object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const element = await getElement('element-uuid');
 */
export async function getElement(element_id: string): Promise<Element | null> {
  const { data, error } = await supabase
    .from('elements')
    .select('*')
    .eq('element_id', element_id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch element: ${error.message}`);
  }

  return ElementSchema.parse(data);
}

/**
 * List elements for a venue_vendor
 *
 * @param venue_vendor_id - The UUID of the venue_vendor relationship
 * @param category - Optional: filter by category
 * @returns Array of elements
 * @throws {Error} If the database query fails
 *
 * @example
 * const elements = await listElements('venue-vendor-uuid');
 * const catering = await listElements('venue-vendor-uuid', 'catering');
 */
export async function listElements(
  venue_vendor_id: string,
  category?: string
): Promise<Element[]> {
  let query = supabase
    .from('elements')
    .select('*')
    .eq('venue_vendor_id', venue_vendor_id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list elements: ${error.message}`);
  }

  return data?.map((element) => ElementSchema.parse(element)) || [];
}

/**
 * Get all elements available for a venue
 *
 * Returns all elements from all approved vendors for a venue.
 *
 * @param venue_id - The UUID of the venue
 * @param category - Optional: filter by category
 * @returns Array of elements with vendor info
 * @throws {Error} If database query fails
 *
 * @example
 * const allElements = await getVenueElements('venue-uuid');
 * const floralOptions = await getVenueElements('venue-uuid', 'florals');
 */
export async function getVenueElements(
  venue_id: string,
  category?: string
): Promise<any[]> {
  let query = supabase
    .from('elements')
    .select('*, venue_vendors!inner(venue_id, approval_status, vendors(*))')
    .eq('venue_vendors.venue_id', venue_id)
    .eq('venue_vendors.approval_status', 'approved')
    .is('deleted_at', null)
    .order('category')
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get venue elements: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new element
 *
 * @param element - The element data to create
 * @returns The created element object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const newElement = await createElement({
 *   venue_vendor_id: 'vv-uuid',
 *   name: 'Premium Floral Package',
 *   category: 'florals',
 *   price: 2500.00,
 *   description: 'Includes centerpieces, bouquets, and ceremony flowers',
 *   availability_rules: {
 *     lead_time_days: 30
 *   }
 * });
 */
export async function createElement(element: CreateElement): Promise<Element> {
  // Validate input
  const validated = CreateElementSchema.parse(element);

  const { data, error } = await supabase
    .from('elements')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create element: ${error.message}`);
  }

  return ElementSchema.parse(data);
}

/**
 * Update an existing element
 *
 * @param element_id - The UUID of the element to update
 * @param updates - The fields to update
 * @returns The updated element object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateElement('element-uuid', {
 *   price: 2750.00,
 *   description: 'Updated package includes arch rental'
 * });
 */
export async function updateElement(
  element_id: string,
  updates: UpdateElement
): Promise<Element> {
  // Validate input
  const validated = UpdateElementSchema.parse(updates);

  const { data, error } = await supabase
    .from('elements')
    .update(validated)
    .eq('element_id', element_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update element: ${error.message}`);
  }

  return ElementSchema.parse(data);
}

/**
 * Soft delete an element (sets deleted_at timestamp)
 *
 * @param element_id - The UUID of the element to delete
 * @returns True if successful
 * @throws {Error} If database update fails
 *
 * @example
 * await deleteElement('element-uuid');
 */
export async function deleteElement(element_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('elements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('element_id', element_id);

  if (error) {
    throw new Error(`Failed to delete element: ${error.message}`);
  }

  return true;
}

/**
 * Check if element is available for a specific date
 *
 * Checks lead time requirements and blackout dates.
 *
 * @param element_id - The UUID of the element
 * @param event_date - The event date to check
 * @returns True if available, false otherwise
 * @throws {Error} If database query fails
 *
 * @example
 * const available = await isElementAvailable('element-uuid', '2025-06-15T14:00:00Z');
 */
export async function isElementAvailable(
  element_id: string,
  event_date: string
): Promise<boolean> {
  const element = await getElement(element_id);
  if (!element) {
    return false;
  }

  const eventDate = new Date(event_date);
  const today = new Date();
  const daysUntilEvent = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Check lead time
  const leadTimeDays = element.availability_rules?.lead_time_days || 0;
  if (daysUntilEvent < leadTimeDays) {
    return false;
  }

  // Check blackout dates
  const blackoutDates = element.availability_rules?.blackout_dates || [];
  const eventDateStr = eventDate.toISOString().split('T')[0];
  if (blackoutDates.includes(eventDateStr)) {
    return false;
  }

  return true;
}

/**
 * Get elements by category
 *
 * @param category - The category to filter by
 * @param venue_id - Optional: limit to a specific venue
 * @returns Array of elements
 * @throws {Error} If database query fails
 *
 * @example
 * const cateringOptions = await getElementsByCategory('catering');
 * const venueCatering = await getElementsByCategory('catering', 'venue-uuid');
 */
export async function getElementsByCategory(
  category: string,
  venue_id?: string
): Promise<Element[]> {
  let query: any = supabase
    .from('elements')
    .select('*')
    .eq('category', category)
    .is('deleted_at', null)
    .order('price', { ascending: true });

  if (venue_id) {
    query = supabase
      .from('elements')
      .select('*, venue_vendors!inner(venue_id)')
      .eq('category', category)
      .is('deleted_at', null)
      .eq('venue_vendors.venue_id', venue_id)
      .order('price', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get elements by category: ${error.message}`);
  }

  return data?.map((element: any) => {
    const { venue_vendors, ...elementData } = element;
    return ElementSchema.parse(elementData);
  }) || [];
}

/**
 * Search elements by name or description
 *
 * @param search_term - The search term
 * @param venue_id - Optional: limit to a specific venue
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching elements
 * @throws {Error} If database query fails
 *
 * @example
 * const results = await searchElements('flower');
 * const venueResults = await searchElements('flower', 'venue-uuid');
 */
export async function searchElements(
  search_term: string,
  venue_id?: string,
  limit: number = 20
): Promise<Element[]> {
  let query: any = supabase
    .from('elements')
    .select('*')
    .is('deleted_at', null)
    .or(`name.ilike.%${search_term}%,description.ilike.%${search_term}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (venue_id) {
    query = supabase
      .from('elements')
      .select('*, venue_vendors!inner(venue_id)')
      .is('deleted_at', null)
      .or(`name.ilike.%${search_term}%,description.ilike.%${search_term}%`)
      .eq('venue_vendors.venue_id', venue_id)
      .order('name', { ascending: true })
      .limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search elements: ${error.message}`);
  }

  return data?.map((element: any) => {
    const { venue_vendors, ...elementData } = element;
    return ElementSchema.parse(elementData);
  }) || [];
}
