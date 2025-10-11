import { NextResponse } from 'next/server';
import {
  verifyInvitationToken,
  signUpWithPassword,
  sendMagicLink,
  markInvitationUsed,
  createClientRecord,
} from '@/lib/auth/helpers';
import { clientConfirmationSchema } from '@/lib/auth/validation';

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
      // Send magic link
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

      // For magic link, we'll create the user when they click the link
      // For now, just mark invitation as pending and send the link
      return NextResponse.json({
        success: true,
        method: 'magic',
        message: 'Check your email for the magic link to complete registration',
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
