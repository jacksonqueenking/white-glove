import { NextResponse } from 'next/server';
import {
  verifyInvitationToken,
  signUpWithPassword,
  markInvitationUsed,
  createVendorRecord,
} from '@/lib/auth/helpers';
import { vendorRegistrationSchema } from '@/lib/auth/validation';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/onboarding/vendor
 * Vendor onboarding via venue invitation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validation = vendorRegistrationSchema.safeParse(body);
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

    // Ensure it's a vendor invitation
    if (invitation.invitation_type !== 'vendor') {
      return NextResponse.json(
        { error: 'Invalid invitation type' },
        { status: 400 }
      );
    }

    const { venue_id, services } = invitation.metadata || {};

    if (!venue_id) {
      return NextResponse.json(
        { error: 'Incomplete invitation data' },
        { status: 400 }
      );
    }

    // Sign up user
    const signupResult = await signUpWithPassword(
      email,
      password,
      'vendor',
      contactName,
      {
        business_name: name,
        phone,
        services,
      }
    );

    if (signupResult.error || !signupResult.data) {
      return NextResponse.json(
        { error: signupResult.error?.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    const userId = signupResult.data.user.id;

    // Create vendor record
    const vendorResult = await createVendorRecord(
      userId,
      name,
      email,
      phone,
      { street, city, state, zip, country: 'US' },
      description
    );

    if (!vendorResult.success) {
      return NextResponse.json(
        { error: vendorResult.error || 'Failed to create vendor profile' },
        { status: 500 }
      );
    }

    // Create VenueVendor relationship
    const supabase = createServiceClient();
    const { error: relationshipError } = await supabase
      .from('venue_vendors')
      .insert({
        venue_id,
        vendor_id: userId,
        approval_status: 'pending',
      });

    if (relationshipError) {
      console.error('Failed to create venue-vendor relationship:', relationshipError);
      // Don't fail the whole onboarding, just log it
    }

    // Mark invitation as used
    await markInvitationUsed(token);

    return NextResponse.json({
      success: true,
      user: signupResult.data.user,
      message: 'Vendor account created successfully',
      redirect: '/vendor/dashboard',
    });
  } catch (error) {
    console.error('Vendor onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
