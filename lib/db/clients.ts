/**
 * Client CRUD Operations
 *
 * This module provides database operations for clients.
 * All functions are designed to be callable by LLM agents as tools.
 */

import { supabase, supabaseAdmin } from './supabaseClient';
import {
  ClientSchema,
  CreateClientSchema,
  UpdateClientSchema,
  type Client,
  type CreateClient,
  type UpdateClient,
} from '../schemas';

/**
 * Get a client by ID
 *
 * @param client_id - The UUID of the client to retrieve
 * @returns The client object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const client = await getClient('client-uuid');
 */
export async function getClient(client_id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('client_id', client_id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch client: ${error.message}`);
  }

  return ClientSchema.parse(data);
}

/**
 * Get a client by email
 *
 * Useful for checking if a client already exists before creating.
 *
 * @param email - The email address to search for
 * @returns The client object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const client = await getClientByEmail('client@example.com');
 */
export async function getClientByEmail(email: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch client by email: ${error.message}`);
  }

  return ClientSchema.parse(data);
}

/**
 * List all clients
 *
 * Note: This should typically only be accessible to admin users.
 *
 * @param params - Filter parameters
 * @param params.limit - Maximum number of clients to return (default: 50)
 * @param params.offset - Number of clients to skip (for pagination)
 * @returns Array of clients
 * @throws {Error} If the database query fails
 *
 * @example
 * const clients = await listClients({ limit: 20 });
 */
export async function listClients(params?: {
  limit?: number;
  offset?: number;
}): Promise<Client[]> {
  let query = supabase
    .from('clients')
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
    throw new Error(`Failed to list clients: ${error.message}`);
  }

  return data?.map((client) => ClientSchema.parse(client)) || [];
}

/**
 * Create a new client
 *
 * This should be called after a user signs up via Supabase Auth.
 * The client_id should match the auth.users.id.
 *
 * @param client - The client data to create
 * @returns The created client object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const newClient = await createClient({
 *   client_id: authUser.id,
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '555-1234',
 *   billing_address: {
 *     street: '123 Main St',
 *     city: 'New York',
 *     state: 'NY',
 *     zip: '10001',
 *     country: 'USA'
 *   }
 * });
 */
export async function createClient(client: CreateClient): Promise<Client> {
  // Validate input
  const validated = CreateClientSchema.parse(client);

  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert(validated as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`);
  }

  return ClientSchema.parse(data);
}

/**
 * Update an existing client
 *
 * @param client_id - The UUID of the client to update
 * @param updates - The fields to update
 * @returns The updated client object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateClient('client-uuid', {
 *   phone: '555-5678',
 *   preferences: {
 *     food: 'Vegetarian preferred',
 *     notes: 'Allergic to shellfish'
 *   }
 * });
 */
export async function updateClient(
  client_id: string,
  updates: UpdateClient
): Promise<Client> {
  // Validate input
  const validated = UpdateClientSchema.parse(updates);

  const { data, error } = await supabase
    .from('clients')
    .update(validated)
    .eq('client_id', client_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }

  return ClientSchema.parse(data);
}

/**
 * Soft delete a client (sets deleted_at timestamp)
 *
 * @param client_id - The UUID of the client to delete
 * @returns True if successful
 * @throws {Error} If database update fails
 *
 * @example
 * await deleteClient('client-uuid');
 */
export async function deleteClient(client_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('client_id', client_id);

  if (error) {
    throw new Error(`Failed to delete client: ${error.message}`);
  }

  return true;
}

/**
 * Update client preferences
 *
 * A convenience function for updating just the preferences field.
 *
 * @param client_id - The UUID of the client
 * @param preferences - The preferences to update (partial update supported)
 * @returns The updated client object
 * @throws {Error} If update fails
 *
 * @example
 * await updateClientPreferences('client-uuid', {
 *   food: 'No red meat',
 *   people: [
 *     { name: 'Wedding Planner', role: 'Planner', email: 'planner@example.com' }
 *   ]
 * });
 */
export async function updateClientPreferences(
  client_id: string,
  preferences: Partial<{
    people: Array<{ name: string; role: string; email?: string; phone?: string; notes?: string }>;
    food: string;
    notes: string;
  }>
): Promise<Client> {
  // Get current client to merge preferences
  const currentClient = await getClient(client_id);
  if (!currentClient) {
    throw new Error('Client not found');
  }

  const currentPrefs = currentClient.preferences || { people: [], food: '', notes: '' };
  const mergedPreferences = {
    ...currentPrefs,
    ...preferences,
  };

  return updateClient(client_id, { preferences: mergedPreferences });
}

/**
 * Update client Stripe customer ID
 *
 * Called after a client's payment method is set up in Stripe.
 *
 * @param client_id - The UUID of the client
 * @param stripe_customer_id - The Stripe customer ID
 * @returns The updated client object
 * @throws {Error} If update fails
 *
 * @example
 * await updateClientStripeId('client-uuid', 'cus_1234567890');
 */
export async function updateClientStripeId(
  client_id: string,
  stripe_customer_id: string
): Promise<Client> {
  return updateClient(client_id, { credit_card_stripe_id: stripe_customer_id });
}

/**
 * Get total number of events for a client
 *
 * @param client_id - The UUID of the client
 * @returns Count of events (including all statuses)
 * @throws {Error} If database query fails
 *
 * @example
 * const count = await getClientEventCount('client-uuid');
 */
export async function getClientEventCount(client_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', client_id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to get client event count: ${error.message}`);
  }

  return count || 0;
}
