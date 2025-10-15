/**
 * Venue-Vendor Relationship CRUD Operations
 *
 * This module provides database operations for venue-vendor relationships.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';

export interface VenueVendor {
  venue_vendor_id: string;
  venue_id: string;
  vendor_id: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'n/a';
  cois: any[];
  created_at: string;
  updated_at: string;
}

/**
 * Get all vendors for a venue
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue
 * @returns Array of venue-vendor relationships with vendor details
 * @throws {Error} If database query fails
 *
 * @example
 * ```typescript
 * const vendors = await getVenueVendors(supabase, venueId);
 * ```
 */
export async function getVenueVendors(
  supabase: SupabaseClient<Database>,
  venue_id: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('venue_vendors')
    .select('*, vendors(*)')
    .eq('venue_id', venue_id);

  if (error) {
    throw new Error(`Failed to get venue vendors: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific venue-vendor relationship
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue
 * @param vendor_id - The UUID of the vendor
 * @returns The venue-vendor relationship or null
 * @throws {Error} If database query fails
 *
 * @example
 * ```typescript
 * const relationship = await getVenueVendor(supabase, venueId, vendorId);
 * ```
 */
export async function getVenueVendor(
  supabase: SupabaseClient<Database>,
  venue_id: string,
  vendor_id: string
): Promise<VenueVendor | null> {
  const { data, error } = await supabase
    .from('venue_vendors')
    .select('*')
    .eq('venue_id', venue_id)
    .eq('vendor_id', vendor_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get venue vendor: ${error.message}`);
  }

  return data;
}

/**
 * Create a venue-vendor relationship
 *
 * @param supabase - Supabase client instance
 * @param venue_id - The UUID of the venue
 * @param vendor_id - The UUID of the vendor
 * @param approval_status - Initial approval status
 * @returns The created relationship
 * @throws {Error} If database insert fails
 *
 * @example
 * ```typescript
 * const relationship = await createVenueVendor(supabase, venueId, vendorId, 'pending');
 * ```
 */
export async function createVenueVendor(
  supabase: SupabaseClient<Database>,
  venue_id: string,
  vendor_id: string,
  approval_status: 'pending' | 'approved' | 'rejected' | 'n/a' = 'pending'
): Promise<VenueVendor> {
  const { data, error } = await supabase
    .from('venue_vendors')
    .insert({
      venue_id,
      vendor_id,
      approval_status,
      cois: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create venue vendor: ${error.message}`);
  }

  return data;
}

/**
 * Update venue-vendor approval status
 *
 * @param supabase - Supabase client instance
 * @param venue_vendor_id - The UUID of the relationship
 * @param approval_status - New approval status
 * @returns The updated relationship
 * @throws {Error} If database update fails
 *
 * @example
 * ```typescript
 * const updated = await updateVenueVendorStatus(supabase, venueVendorId, 'approved');
 * ```
 */
export async function updateVenueVendorStatus(
  supabase: SupabaseClient<Database>,
  venue_vendor_id: string,
  approval_status: 'pending' | 'approved' | 'rejected' | 'n/a'
): Promise<VenueVendor> {
  const { data, error } = await supabase
    .from('venue_vendors')
    .update({ approval_status })
    .eq('venue_vendor_id', venue_vendor_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update venue vendor status: ${error.message}`);
  }

  return data;
}

/**
 * Get elements count for a venue-vendor
 *
 * @param supabase - Supabase client instance
 * @param venue_vendor_id - The UUID of the relationship
 * @returns Number of elements
 * @throws {Error} If database query fails
 *
 * @example
 * ```typescript
 * const count = await getVenueVendorElementsCount(supabase, venueVendorId);
 * ```
 */
export async function getVenueVendorElementsCount(
  supabase: SupabaseClient<Database>,
  venue_vendor_id: string
): Promise<number> {
  const { count, error } = await supabase
    .from('elements')
    .select('*', { count: 'exact', head: true })
    .eq('venue_vendor_id', venue_vendor_id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to count elements: ${error.message}`);
  }

  return count || 0;
}
