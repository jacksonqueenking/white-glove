import { NextResponse } from 'next/server';
import {
  verifyInvitationToken,
  signUpWithPassword,
  sendMagicLink,
  markInvitationUsed,
  createClientRecord,
} from '@/lib/auth/helpers';
import { clientConfirmationSchema } from '@/lib/auth/validation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/onboarding/client
 * Client onboarding via booking confirmation link
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validation = clientConfirmationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { token, authMethod, password } = validation.data;

    // Verify the confirmation token (invitation)
    const { valid, invitation, error: verifyError } = await verifyInvitationToken(token);

    if (!valid || !invitation) {
      return NextResponse.json(
        { error: verifyError || 'Invalid confirmation token' },
        { status: 400 }
      );
    }

    // Ensure it's a client invitation
    if (invitation.invitation_type !== 'client') {
      return NextResponse.json(
        { error: 'Invalid invitation type' },
        { status: 400 }
      );
    }

    const { invitee_email, metadata } = invitation;
    const { name, phone, event_id } = metadata || {};

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Incomplete invitation data' },
        { status: 400 }
      );
    }

    let userId: string;

    if (authMethod === 'magic') {
      // For magic link, create the account first, then send the link to login
      // Use service client to ensure user is created properly
      const serviceSupabase = createServiceClient();

      // Sign up the user with a random password (they won't need it)
      const { data: signupData, error: signupError } = await serviceSupabase.auth.admin.createUser({
        email: invitee_email,
        password: crypto.randomUUID(), // Random password for magic-link-only users
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          user_type: 'client',
          name,
          phone,
          event_id,
          onboarding_completed: false,
        },
      });

      if (signupError || !signupData.user) {
        return NextResponse.json(
          { error: signupError?.message || 'Failed to create account' },
          { status: 400 }
        );
      }

      userId = signupData.user.id;

      // Create client record
      const clientResult = await createClientRecord(
        userId,
        invitee_email,
        name,
        phone
      );

      if (!clientResult.success) {
        return NextResponse.json(
          { error: clientResult.error || 'Failed to create client profile' },
          { status: 500 }
        );
      }

      // Update the event with the client_id and change status to confirmed
      await serviceSupabase
        .from('events')
        .update({ client_id: userId, status: 'confirmed' })
        .eq('event_id', event_id);

      // Mark invitation as used
      await markInvitationUsed(token);

      // Now send magic link for them to login
      const result = await sendMagicLink(
        invitee_email,
        'client',
        `/client/event/${event_id}`
      );

      if (result.error) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        method: 'magic',
        message: 'Account created! Check your email for the magic link to sign in.',
      });
    } else {
      // Password signup
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      const signupResult = await signUpWithPassword(
        invitee_email,
        password,
        'client',
        name,
        { phone, event_id }
      );

      if (signupResult.error || !signupResult.data) {
        return NextResponse.json(
          { error: signupResult.error?.message || 'Failed to create account' },
          { status: 400 }
        );
      }

      userId = signupResult.data.user.id;

      // Create client record
      const clientResult = await createClientRecord(
        userId,
        invitee_email,
        name,
        phone
      );

      if (!clientResult.success) {
        return NextResponse.json(
          { error: clientResult.error || 'Failed to create client profile' },
          { status: 500 }
        );
      }

      // Update the event with the client_id and change status to confirmed
      const serviceSupabase = createServiceClient();
      await serviceSupabase
        .from('events')
        .update({ client_id: userId, status: 'confirmed' })
        .eq('event_id', event_id);

      // Mark invitation as used
      await markInvitationUsed(token);

      return NextResponse.json({
        success: true,
        method: 'password',
        user: signupResult.data.user,
        message: 'Account created successfully',
        redirect: `/client/event/${event_id}`,
      });
    }
  } catch (error) {
    console.error('Client onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
