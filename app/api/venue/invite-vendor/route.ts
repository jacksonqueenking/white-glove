import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { createInvitation } from '../../../../lib/db/invitations';
import { getVendorByEmail, createVendor } from '../../../../lib/db/vendors';
import { createVenueVendor } from '../../../../lib/db/venue_vendors';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get venue ID from user email
    const { data: venueData } = await supabase
      .from('venues')
      .select('venue_id')
      .eq('email', user.email)
      .single();

    if (!venueData) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const venueId = venueData.venue_id;

    // Parse request body
    const body = await request.json();
    const { name, email, phone, category, personalNote } = body;

    // Validate required fields
    if (!name || !email || !phone || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, category' },
        { status: 400 }
      );
    }

    // Check if vendor already exists
    let vendor = await getVendorByEmail(supabase, email);

    if (!vendor) {
      // Create new vendor
      vendor = await createVendor(supabase, {
        name,
        email,
        phone_number: phone,
        address: {
          street: '',
          city: '',
          state: 'CA',
          zip: '00000',
          country: 'USA',
        },
        description: `${category} services`,
        contact_persons: [],
      });
    }

    // Create venue-vendor relationship if it doesn't exist
    const { data: existingRelationship } = await supabase
      .from('venue_vendors')
      .select('venue_vendor_id')
      .eq('venue_id', venueId)
      .eq('vendor_id', vendor.vendor_id)
      .single();

    if (!existingRelationship) {
      await createVenueVendor(supabase, venueId, vendor.vendor_id, 'pending');
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = await createInvitation(supabase, {
      invitee_email: email,
      invited_by: venueId,
      invitation_type: 'vendor',
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      metadata: {
        venue_id: venueId,
        vendor_id: vendor.vendor_id,
        category,
        personal_note: personalNote,
      },
    });

    // TODO: Send invitation email
    // This would call your email service to send the invitation

    return NextResponse.json({
      success: true,
      invitation_id: invitation.invitation_id,
      vendor_id: vendor.vendor_id,
    });
  } catch (error) {
    console.error('Failed to invite vendor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invite vendor' },
      { status: 500 }
    );
  }
}
