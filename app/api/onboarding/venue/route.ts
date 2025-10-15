import { NextResponse } from 'next/server';
import {
  verifyInvitationToken,
  signUpWithPassword,
  markInvitationUsed,
  createVenueRecord,
} from '@/lib/auth/helpers';
import { venueRegistrationSchema } from '@/lib/auth/validation';
import { createServiceClient } from '@/lib/supabase/server';

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
      spaces,
      offerings,
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

    const supabase = createServiceClient();

    // Create spaces if provided
    if (spaces && Array.isArray(spaces) && spaces.length > 0) {
      for (const space of spaces) {
        const { error: spaceError } = await supabase.from('spaces').insert({
          venue_id: userId,
          name: space.name,
          description: space.description,
          capacity: space.capacity,
          main_image_url: space.main_image_url || null,
        });

        if (spaceError) {
          console.error('Failed to create space:', spaceError);
          // Continue creating other spaces even if one fails
        }
      }
    }

    // Create a vendor record for the venue (so it can offer in-house services)
    // This allows the venue to act as its own vendor for in-house offerings
    const { error: vendorError } = await supabase.from('vendors').insert({
      vendor_id: userId,
      name: name,
      email: email,
      phone_number: phone,
      address: { street, city, state, zip, country: 'US' },
      description: `In-house services provided by ${name}`,
    });

    if (vendorError) {
      console.error('Failed to create vendor record for venue:', vendorError);
      // This is not critical - venue can still operate without in-house offerings
    }

    // Create venue-vendor relationship (venue acts as its own vendor for in-house offerings)
    const { data: venueVendor, error: venueVendorError } = await supabase
      .from('venue_vendors')
      .insert({
        venue_id: userId,
        vendor_id: userId, // Venue acts as its own vendor
        approval_status: 'approved', // Auto-approve venue's own offerings
      })
      .select()
      .single();

    if (venueVendorError) {
      console.error('Failed to create venue-vendor relationship:', venueVendorError);
    }

    // Create offerings/elements if provided and venue-vendor relationship was created
    if (offerings && Array.isArray(offerings) && offerings.length > 0 && venueVendor) {
      for (const offering of offerings) {
        const { error: offeringError } = await supabase.from('elements').insert({
          venue_vendor_id: (venueVendor as any).venue_vendor_id,
          name: offering.name,
          category: offering.category,
          price: offering.price,
          description: offering.description,
          availability_rules: {
            lead_time_days: offering.lead_time_days || 0,
          },
        });

        if (offeringError) {
          console.error('Failed to create offering:', offeringError);
          // Continue creating other offerings even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: signupResult.data.user,
      message: 'Venue account created successfully',
      redirect: '/venue/dashboard',
    });
  } catch (error) {
    console.error('Venue onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
