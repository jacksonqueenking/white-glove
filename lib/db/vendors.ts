/**
 * Vendor CRUD Operations
 *
 * This module provides database operations for vendors.
 * All functions are designed to be callable by LLM agents as tools.
 */

import { supabase, supabaseAdmin } from './supabaseClient';
import {
  VendorSchema,
  CreateVendorSchema,
  UpdateVendorSchema,
  type Vendor,
  type CreateVendor,
  type UpdateVendor,
} from '../schemas';

/**
 * Get a vendor by ID
 *
 * @param vendor_id - The UUID of the vendor to retrieve
 * @returns The vendor object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const vendor = await getVendor('vendor-uuid');
 */
export async function getVendor(vendor_id: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('vendor_id', vendor_id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch vendor: ${error.message}`);
  }

  return VendorSchema.parse(data);
}

/**
 * Get a vendor by email
 *
 * Useful for checking if a vendor already exists before creating.
 *
 * @param email - The email address to search for
 * @returns The vendor object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const vendor = await getVendorByEmail('vendor@example.com');
 */
export async function getVendorByEmail(email: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch vendor by email: ${error.message}`);
  }

  return VendorSchema.parse(data);
}

/**
 * List all vendors
 *
 * @param params - Filter parameters
 * @param params.limit - Maximum number of vendors to return (default: 50)
 * @param params.offset - Number of vendors to skip (for pagination)
 * @returns Array of vendors
 * @throws {Error} If the database query fails
 *
 * @example
 * const vendors = await listVendors({ limit: 20 });
 */
export async function listVendors(params?: {
  limit?: number;
  offset?: number;
}): Promise<Vendor[]> {
  let query = supabase
    .from('vendors')
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
    throw new Error(`Failed to list vendors: ${error.message}`);
  }

  return data?.map((vendor) => VendorSchema.parse(vendor)) || [];
}

/**
 * Create a new vendor
 *
 * This should be called after a vendor user signs up via Supabase Auth.
 * The vendor_id should match the auth.users.id.
 *
 * @param vendor - The vendor data to create
 * @returns The created vendor object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const newVendor = await createVendor({
 *   vendor_id: authUser.id,
 *   name: 'Elegant Florals',
 *   email: 'contact@elegantflorals.com',
 *   phone_number: '555-1234',
 *   address: {
 *     street: '789 Garden Way',
 *     city: 'Portland',
 *     state: 'OR',
 *     zip: '97201',
 *     country: 'USA'
 *   },
 *   description: 'Premium floral arrangements for weddings and events',
 *   contact_persons: [
 *     {
 *       name: 'Jane Smith',
 *       role: 'Owner',
 *       email: 'jane@elegantflorals.com',
 *       phone: '555-1234',
 *       is_primary: true
 *     }
 *   ]
 * });
 */
export async function createVendor(vendor: CreateVendor): Promise<Vendor> {
  // Validate input
  const validated = CreateVendorSchema.parse(vendor);

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .insert(validated as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create vendor: ${error.message}`);
  }

  return VendorSchema.parse(data);
}

/**
 * Update an existing vendor
 *
 * @param vendor_id - The UUID of the vendor to update
 * @param updates - The fields to update
 * @returns The updated vendor object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateVendor('vendor-uuid', {
 *   description: 'Updated description with new services',
 *   contact_persons: [...]
 * });
 */
export async function updateVendor(
  vendor_id: string,
  updates: UpdateVendor
): Promise<Vendor> {
  // Validate input
  const validated = UpdateVendorSchema.parse(updates);

  const { data, error } = await supabase
    .from('vendors')
    .update(validated)
    .eq('vendor_id', vendor_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update vendor: ${error.message}`);
  }

  return VendorSchema.parse(data);
}

/**
 * Soft delete a vendor (sets deleted_at timestamp)
 *
 * @param vendor_id - The UUID of the vendor to delete
 * @returns True if successful
 * @throws {Error} If database update fails
 *
 * @example
 * await deleteVendor('vendor-uuid');
 */
export async function deleteVendor(vendor_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vendors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('vendor_id', vendor_id);

  if (error) {
    throw new Error(`Failed to delete vendor: ${error.message}`);
  }

  return true;
}

/**
 * Get venues associated with a vendor
 *
 * Returns the list of venues where this vendor is approved to work.
 *
 * @param vendor_id - The UUID of the vendor
 * @param approval_status - Optional: filter by approval status (default: 'approved')
 * @returns Array of venue_vendor relationships with venue details
 * @throws {Error} If database query fails
 *
 * @example
 * const approvedVenues = await getVendorVenues('vendor-uuid');
 * const pendingVenues = await getVendorVenues('vendor-uuid', 'pending');
 */
export async function getVendorVenues(
  vendor_id: string,
  approval_status: string = 'approved'
): Promise<any[]> {
  const { data, error } = await supabase
    .from('venue_vendors')
    .select('*, venues(*)')
    .eq('vendor_id', vendor_id)
    .eq('approval_status', approval_status);

  if (error) {
    throw new Error(`Failed to get vendor venues: ${error.message}`);
  }

  return data || [];
}

/**
 * Get events a vendor is involved in
 *
 * Returns events where the vendor has elements assigned.
 *
 * @param vendor_id - The UUID of the vendor
 * @param upcoming_only - If true, only return upcoming events (default: false)
 * @returns Array of events
 * @throws {Error} If database query fails
 *
 * @example
 * const allEvents = await getVendorEvents('vendor-uuid');
 * const upcomingEvents = await getVendorEvents('vendor-uuid', true);
 */
export async function getVendorEvents(
  vendor_id: string,
  upcoming_only: boolean = false
): Promise<any[]> {
  let query = supabase
    .from('events')
    .select(`
      *,
      event_elements!inner(
        *,
        elements!inner(
          *,
          venue_vendors!inner(vendor_id)
        )
      )
    `)
    .eq('event_elements.elements.venue_vendors.vendor_id', vendor_id)
    .is('deleted_at', null)
    .order('date', { ascending: true });

  if (upcoming_only) {
    const now = new Date().toISOString();
    query = query.gte('date', now);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get vendor events: ${error.message}`);
  }

  return data || [];
}

/**
 * Search vendors by name or description
 *
 * @param search_term - The search term (matches name or description)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching vendors
 * @throws {Error} If database query fails
 *
 * @example
 * const florists = await searchVendors('floral');
 */
export async function searchVendors(
  search_term: string,
  limit: number = 20
): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .is('deleted_at', null)
    .or(`name.ilike.%${search_term}%,description.ilike.%${search_term}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search vendors: ${error.message}`);
  }

  return data?.map((vendor) => VendorSchema.parse(vendor)) || [];
}

/**
 * Add or update a contact person for a vendor
 *
 * @param vendor_id - The UUID of the vendor
 * @param contact_person - The contact person to add/update
 * @returns The updated vendor object
 * @throws {Error} If update fails
 *
 * @example
 * await addVendorContactPerson('vendor-uuid', {
 *   name: 'John Doe',
 *   role: 'Sales Manager',
 *   email: 'john@vendor.com',
 *   phone: '555-5678',
 *   is_primary: false
 * });
 */
export async function addVendorContactPerson(
  vendor_id: string,
  contact_person: {
    name: string;
    role: string;
    email: string;
    phone: string;
    is_primary: boolean;
  }
): Promise<Vendor> {
  const vendor = await getVendor(vendor_id);
  if (!vendor) {
    throw new Error('Vendor not found');
  }

  const currentContacts = vendor.contact_persons || [];
  const updatedContacts = [...currentContacts, contact_person];

  return updateVendor(vendor_id, { contact_persons: updatedContacts });
}
