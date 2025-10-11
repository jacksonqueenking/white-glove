import { NextResponse } from 'next/server';
import {
  verifyInvitationToken,
  signUpWithPassword,
  markInvitationUsed,
  createVenueRecord,
} from '@/lib/auth/helpers';
import { venueRegistrationSchema } from '@/lib/auth/validation';

/**
 * POST /api/onboarding/venue
 * Venue onboarding via invitation link
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validation = venueRegistrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      token,
      name,
      email,
      password,
      phone,
      contactName,
      street,
      city,
      state,
      zip,
      description,
    } = validation.data;

    // Verify the invitation token
    const { valid, invitation, error: verifyError } = await verifyInvitationToken(token);

    if (!valid || !invitation) {
      return NextResponse.json(
        { error: verifyError || 'Invalid invitation token' },
        { status: 400 }
      );
    }

    // Ensure it's a venue invitation
    if (invitation.invitation_type !== 'venue') {
      return NextResponse.json(
        { error: 'Invalid invitation type' },
        { status: 400 }
      );
    }

    // Sign up user
    const signupResult = await signUpWithPassword(
      email,
      password,
      'venue',
      contactName,
      {
        venue_name: name,
        phone,
      }
    );

    if (signupResult.error || !signupResult.data) {
      return NextResponse.json(
        { error: signupResult.error?.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    const userId = signupResult.data.user.id;

    // Create venue record
    const venueResult = await createVenueRecord(
      userId,
      name,
      { street, city, state, zip, country: 'US' },
      description
    );

    if (!venueResult.success) {
      return NextResponse.json(
        { error: venueResult.error || 'Failed to create venue profile' },
        { status: 500 }
      );
    }

    // Mark invitation as used
    await markInvitationUsed(token);

    return NextResponse.json({
      success: true,
      user: signupResult.data.user,
      message: 'Venue account created successfully',
      redirect: '/venue/onboarding/spaces',
    });
  } catch (error) {
    console.error('Venue onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
