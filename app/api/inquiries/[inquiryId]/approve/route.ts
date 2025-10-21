import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { sendInquiryApprovalEmail, sendInquiryDeclineEmail } from '@/lib/email/resend';

const approvalSchema = z.object({
  decision: z.enum(['approve', 'decline']),
  venue_notes: z.string().optional(),
  decline_reason: z.string().optional(),
  suggest_alternatives: z.boolean().optional(),
  alternative_dates: z.array(z.object({
    date: z.string(),
    time: z.string(),
    notes: z.string().optional(),
  })).optional(),
});

/**
 * POST /api/inquiries/[inquiryId]/approve
 * Approve or decline a client inquiry
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ inquiryId: string }> }
) {
  try {
    const { inquiryId } = await params;
    const body = await request.json();

    // Validate request
    const validation = approvalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { decision, venue_notes, decline_reason, alternative_dates } = validation.data;
    const supabase = createServiceClient();

    // 1. Get the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('client_inquiries')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // 2. Check if already processed
    if (inquiry.status !== 'pending') {
      return NextResponse.json(
        { error: 'Inquiry has already been processed' },
        { status: 400 }
      );
    }

    // 3. Get venue details
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('venue_id, name')
      .eq('venue_id', inquiry.venue_id)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    if (decision === 'decline') {
      // Handle decline
      if (!decline_reason) {
        return NextResponse.json(
          { error: 'Decline reason is required' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('client_inquiries')
        .update({
          status: 'declined',
          decline_reason,
          alternative_dates: alternative_dates || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('inquiry_id', inquiryId);

      if (updateError) {
        console.error('Error declining inquiry:', updateError);
        return NextResponse.json(
          { error: 'Failed to decline inquiry' },
          { status: 500 }
        );
      }

      // Send decline email to client
      try {
        await sendInquiryDeclineEmail({
          clientName: inquiry.client_name,
          clientEmail: inquiry.client_email,
          venueName: venue.name,
          eventDate: inquiry.event_date,
          declineReason: decline_reason,
          alternativeDates: alternative_dates,
        });
      } catch (emailError) {
        console.error('Error sending decline email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        status: 'declined',
        message: 'Inquiry declined and client notified',
      });
    }

    // 4. Handle approval
    // Create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        name: `${inquiry.client_name}'s Event`,
        description: inquiry.description,
        date: new Date(`${inquiry.event_date}T${inquiry.event_time}`).toISOString(),
        venue_id: inquiry.venue_id,
        status: 'pending_confirmation', // Awaiting client confirmation
        client_id: null, // Will be set when client creates account
      })
      .select()
      .single();

    if (eventError || !event) {
      console.error('Error creating event:', eventError);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    // 5. Link spaces to event
    const eventSpaces = inquiry.space_ids.map((spaceId: string) => ({
      event_id: event.event_id,
      space_id: spaceId,
    }));

    const { error: spacesError } = await supabase
      .from('event_spaces')
      .insert(eventSpaces);

    if (spacesError) {
      console.error('Error linking spaces:', spacesError);
      // Cleanup: delete the event
      await supabase.from('events').delete().eq('event_id', event.event_id);
      return NextResponse.json(
        { error: 'Failed to link spaces to event' },
        { status: 500 }
      );
    }

    // 6. Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry

    // 7. Create invitation
    const { error: invitationError } = await supabase
      .from('invitations')
      .insert({
        token,
        invitee_email: inquiry.client_email,
        invited_by: inquiry.venue_id,
        invitation_type: 'client',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        metadata: {
          name: inquiry.client_name,
          phone: inquiry.client_phone,
          event_id: event.event_id,
          inquiry_id: inquiryId,
          venue_name: venue.name,
          budget: inquiry.budget,
          guest_count: inquiry.guest_count,
        },
      });

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      // Cleanup
      await supabase.from('events').delete().eq('event_id', event.event_id);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // 8. Update inquiry with event and invitation info
    const { error: updateError } = await supabase
      .from('client_inquiries')
      .update({
        status: 'approved',
        event_id: event.event_id,
        invitation_token: token,
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: expiresAt.toISOString(),
        venue_notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('inquiry_id', inquiryId);

    if (updateError) {
      console.error('Error updating inquiry:', updateError);
      // Don't fail the request, invitation is already created
    }

    // 9. Get space names for the email
    const { data: spaces } = await supabase
      .from('spaces')
      .select('name')
      .in('space_id', inquiry.space_ids);

    const spaceNames = spaces?.map(s => s.name) || [];

    // 10. Send confirmation email to client
    try {
      await sendInquiryApprovalEmail({
        clientName: inquiry.client_name,
        clientEmail: inquiry.client_email,
        venueName: venue.name,
        eventDate: inquiry.event_date,
        eventTime: inquiry.event_time,
        spaceNames,
        guestCount: inquiry.guest_count,
        venueNotes: venue_notes,
        confirmationToken: token,
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the request if email fails
    }

    // 11. TODO: Optionally invoke AI to suggest elements for the event
    // This could be done asynchronously

    return NextResponse.json({
      success: true,
      status: 'approved',
      event_id: event.event_id,
      invitation_token: token,
      message: 'Inquiry approved and invitation sent to client',
      confirmation_link: `/auth/client/confirm/${token}`,
    });

  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
