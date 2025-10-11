// Authentication helper functions
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { UserType, Address } from './validation';
import type { AuthResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send magic link for passwordless authentication
 */
export async function sendMagicLink(
  email: string,
  userType: UserType,
  redirectTo?: string
): Promise<AuthResponse<{ email: string }>> {
  const supabase = await createClient();

  const redirectUrl = redirectTo || `${BASE_URL}/${userType}/dashboard`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        user_type: userType,
      },
    },
  });

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return {
    data: { email },
    error: null,
  };
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  userType: UserType,
  name: string,
  additionalData?: Record<string, any>
): Promise<AuthResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: userType,
        name,
        onboarding_completed: false,
        ...additionalData,
      },
      emailRedirectTo: `${BASE_URL}/${userType}/verify`,
    },
  });

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  if (!data.session || !data.user) {
    return {
      data: null,
      error: {
        message: 'Failed to create session',
      },
    };
  }

  return {
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at || 0,
      expires_in: data.session.expires_in || 0,
      user: {
        id: data.user.id,
        email: data.user.email!,
        user_metadata: data.user.user_metadata as any,
        created_at: data.user.created_at!,
        last_sign_in_at: data.user.last_sign_in_at,
      },
    },
    error: null,
  };
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  if (!data.session || !data.user) {
    return {
      data: null,
      error: {
        message: 'Failed to create session',
      },
    };
  }

  return {
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at || 0,
      expires_in: data.session.expires_in || 0,
      user: {
        id: data.user.id,
        email: data.user.email!,
        user_metadata: data.user.user_metadata as any,
        created_at: data.user.created_at!,
        last_sign_in_at: data.user.last_sign_in_at,
      },
    },
    error: null,
  };
}

/**
 * Sign out
 */
export async function signOut(): Promise<AuthResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return {
    data: null,
    error: null,
  };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<AuthResponse<{ email: string }>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${BASE_URL}/reset-password`,
  });

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return {
    data: { email },
    error: null,
  };
}

/**
 * Update password
 */
export async function updatePassword(
  newPassword: string
): Promise<AuthResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return {
    data: null,
    error: null,
  };
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at || 0,
    expires_in: data.session.expires_in || 0,
    user: {
      id: data.session.user.id,
      email: data.session.user.email!,
      user_metadata: data.session.user.user_metadata as any,
      created_at: data.session.user.created_at!,
      last_sign_in_at: data.session.user.last_sign_in_at,
    },
  };
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email!,
    user_metadata: data.user.user_metadata as any,
    created_at: data.user.created_at!,
    last_sign_in_at: data.user.last_sign_in_at,
  };
}

/**
 * Create client record after signup
 */
export async function createClientRecord(
  userId: string,
  email: string,
  name: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase.from('clients').insert({
    client_id: userId,
    name,
    email,
    phone,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create venue record after signup
 */
export async function createVenueRecord(
  userId: string,
  name: string,
  email: string,
  phone: string,
  address: Address,
  description: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase.from('venues').insert({
    venue_id: userId,
    name,
    description,
    address,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create vendor record after signup
 */
export async function createVendorRecord(
  userId: string,
  name: string,
  email: string,
  phone: string,
  address: Address,
  description: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase.from('vendors').insert({
    vendor_id: userId,
    name,
    email,
    phone_number: phone,
    address,
    description,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Verify invitation token
 */
export async function verifyInvitationToken(
  token: string
): Promise<{ valid: boolean; invitation?: any; error?: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired invitation' };
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('invitation_id', data.invitation_id);

    return { valid: false, error: 'Invitation has expired' };
  }

  return { valid: true, invitation: data };
}

/**
 * Mark invitation as used
 */
export async function markInvitationUsed(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      used_at: new Date().toISOString(),
    })
    .eq('token', token);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
