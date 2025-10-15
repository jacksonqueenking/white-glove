/**
 * Invitation CRUD Operations
 *
 * This module provides database operations for user invitations.
 * All functions are designed to be callable by LLM agents as tools.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import {
  InvitationSchema,
  CreateInvitationSchema,
  type Invitation,
  type CreateInvitation,
  type InvitationType,
  type InvitationStatus,
} from '../schemas';
import { randomBytes } from 'crypto';

/**
 * Generate a secure invitation token
 *
 * @returns A secure random token
 */
function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Get an invitation by ID
 *
 * @param supabase - Supabase client instance
 * @param invitation_id - The UUID of the invitation to retrieve
 * @returns The invitation object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const invitation = await getInvitation(supabase, 'invitation-uuid');
 */
export async function getInvitation(supabase: SupabaseClient<Database>, invitation_id: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invitation_id', invitation_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch invitation: ${error.message}`);
  }

  return InvitationSchema.parse(data);
}

/**
 * Get an invitation by token
 *
 * @param supabase - Supabase client instance
 * @param token - The invitation token
 * @returns The invitation object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const invitation = await getInvitationByToken(supabase, 'abc123...');
 */
export async function getInvitationByToken(supabase: SupabaseClient<Database>, token: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch invitation by token: ${error.message}`);
  }

  return InvitationSchema.parse(data);
}

/**
 * Create an invitation
 *
 * Note: Requires admin privileges.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param invitation - The invitation data (token will be auto-generated if not provided)
 * @returns The created invitation object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const invitation = await createInvitation(supabaseAdmin, {
 *   invitee_email: 'vendor@example.com',
 *   invited_by: 'venue-uuid',
 *   invitation_type: 'vendor',
 *   expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
 *   metadata: { venue_id: 'venue-uuid' }
 * });
 */
export async function createInvitation(
  supabase: SupabaseClient<Database>,
  invitation: Omit<CreateInvitation, 'token'> & { token?: string }
): Promise<Invitation> {
  const token = invitation.token || generateInvitationToken();

  const validated = CreateInvitationSchema.parse({
    ...invitation,
    token,
    status: 'pending',
  });

  const { data, error } = await supabase
    .from('invitations')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  return InvitationSchema.parse(data);
}

/**
 * List invitations sent by a user
 *
 * @param supabase - Supabase client instance
 * @param invited_by - The UUID of the user who sent the invitations
 * @param status - Optional: filter by status
 * @returns Array of invitations
 * @throws {Error} If database query fails
 *
 * @example
 * const allInvitations = await listInvitations(supabase, 'user-uuid');
 * const pending = await listInvitations(supabase, 'user-uuid', 'pending');
 */
export async function listInvitations(
  supabase: SupabaseClient<Database>,
  invited_by: string,
  status?: InvitationStatus
): Promise<Invitation[]> {
  let query = supabase
    .from('invitations')
    .select('*')
    .eq('invited_by', invited_by)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list invitations: ${error.message}`);
  }

  return data?.map((invitation: any) => InvitationSchema.parse(invitation)) || [];
}

/**
 * Accept an invitation
 *
 * Marks the invitation as accepted and sets the used_at timestamp.
 * Note: Requires admin privileges.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param token - The invitation token
 * @returns The updated invitation
 * @throws {Error} If invitation not found, expired, or already used
 *
 * @example
 * const invitation = await acceptInvitation(supabaseAdmin, 'abc123...');
 */
export async function acceptInvitation(supabase: SupabaseClient<Database>, token: string): Promise<Invitation> {
  const invitation = await getInvitationByToken(supabase, token);

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation already ${invitation.status}`);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('invitation_id', invitation.invitation_id);

    throw new Error('Invitation has expired');
  }

  const { data, error } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      used_at: new Date().toISOString(),
    })
    .eq('invitation_id', invitation.invitation_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to accept invitation: ${error.message}`);
  }

  return InvitationSchema.parse(data);
}

/**
 * Decline an invitation
 *
 * Marks the invitation as declined.
 * Note: Requires admin privileges.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param token - The invitation token
 * @returns The updated invitation
 * @throws {Error} If invitation not found or already used
 *
 * @example
 * const invitation = await declineInvitation(supabaseAdmin, 'abc123...');
 */
export async function declineInvitation(supabase: SupabaseClient<Database>, token: string): Promise<Invitation> {
  const invitation = await getInvitationByToken(supabase, token);

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation already ${invitation.status}`);
  }

  const { data, error } = await supabase
    .from('invitations')
    .update({
      status: 'declined',
      used_at: new Date().toISOString(),
    })
    .eq('invitation_id', invitation.invitation_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to decline invitation: ${error.message}`);
  }

  return InvitationSchema.parse(data);
}

/**
 * Verify an invitation token
 *
 * Checks if a token is valid and not expired.
 * Note: Requires admin privileges for marking as expired.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param token - The invitation token to verify
 * @returns Object with validation result and invitation if valid
 *
 * @example
 * const result = await verifyInvitationToken(supabaseAdmin, 'abc123...');
 * if (result.valid) {
 *   // Token is valid, proceed with registration
 * }
 */
export async function verifyInvitationToken(supabase: SupabaseClient<Database>, token: string): Promise<{
  valid: boolean;
  invitation: Invitation | null;
  error?: string;
}> {
  const invitation = await getInvitationByToken(supabase, token);

  if (!invitation) {
    return { valid: false, invitation: null, error: 'Invitation not found' };
  }

  if (invitation.status !== 'pending') {
    return { valid: false, invitation, error: `Invitation already ${invitation.status}` };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('invitation_id', invitation.invitation_id);

    return { valid: false, invitation, error: 'Invitation has expired' };
  }

  return { valid: true, invitation };
}

/**
 * Expire old pending invitations
 *
 * Marks all pending invitations past their expiration date as expired.
 * Note: Requires admin privileges.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @returns Number of invitations expired
 * @throws {Error} If update fails
 *
 * @example
 * const count = await expireOldInvitations(supabaseAdmin);
 */
export async function expireOldInvitations(supabase: SupabaseClient<Database>): Promise<number> {
  const now = new Date().toISOString();

  const { count, error } = await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', now);

  if (error) {
    throw new Error(`Failed to expire old invitations: ${error.message}`);
  }

  return count || 0;
}

/**
 * Resend an invitation
 *
 * Creates a new invitation with a fresh token and expiration date.
 * Marks the old invitation as expired.
 * Note: Requires admin privileges.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param old_invitation_id - The UUID of the invitation to resend
 * @param new_expiration_days - Days until new invitation expires (default: 7)
 * @returns The new invitation object
 * @throws {Error} If old invitation not found or new invitation fails to create
 *
 * @example
 * const newInvitation = await resendInvitation(supabaseAdmin, 'old-invitation-uuid');
 */
export async function resendInvitation(
  supabase: SupabaseClient<Database>,
  old_invitation_id: string,
  new_expiration_days: number = 7
): Promise<Invitation> {
  const oldInvitation = await getInvitation(supabase, old_invitation_id);

  if (!oldInvitation) {
    throw new Error('Invitation not found');
  }

  // Mark old invitation as expired
  await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('invitation_id', old_invitation_id);

  // Create new invitation
  const newExpiration = new Date();
  newExpiration.setDate(newExpiration.getDate() + new_expiration_days);

  return createInvitation(supabase, {
    invitee_email: oldInvitation.invitee_email,
    invited_by: oldInvitation.invited_by,
    invitation_type: oldInvitation.invitation_type,
    expires_at: newExpiration.toISOString(),
    metadata: oldInvitation.metadata,
  } as any);
}
