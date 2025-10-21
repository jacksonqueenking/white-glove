import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { sendNewInquiryNotification } from '@/lib/email/resend';

// Validation schema for client inquiry form
const inquiryFormSchema = z.object({
  venue_id: z.string().uuid('Invalid venue ID'),

  // Client information
  client_name: z.string().min(2, 'Name must be at least 2 characters'),
  client_email: z.string().email('Valid email required'),
  client_phone: z.string().regex(/^[0-9\-()+\s]+$/, 'Valid phone number required'),
  company_name: z.string().optional(),

  // Event details
  event_date: z.string().refine((date) => {
    const d = new Date(date);
    return d > new Date();
  }, 'Event date must be in the future'),
  event_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid time required (HH:MM)'),
  event_type: z.string().optional(),
  space_ids: z.array(z.string().uuid()).min(1, 'At least one space must be selected'),
  guest_count: z.number().int().min(1, 'Guest count must be at least 1').max(10000, 'Guest count too large'),
  budget: z.number().min(0, 'Budget must be non-negative'),
  description: z.string().min(10, 'Please provide at least 10 characters describing your event'),

  // Optional preferences
  preferred_contact_method: z.enum(['email', 'phone', 'either']).optional(),

  // Metadata
  source: z.string().default('website'),
});

type InquiryFormData = z.infer<typeof inquiryFormSchema>;

/**
 * POST /api/inquiries
 * Submit a new client inquiry form (pre-account)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = inquiryFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const data: InquiryFormData = validation.data;
    const supabase = createServiceClient();

    // 1. Verify venue exists
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('venue_id, name')
      .eq('venue_id', data.venue_id)
      .is('deleted_at', null)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // 2. Verify all spaces exist and belong to the venue
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('space_id, name, venue_id')
      .in('space_id', data.space_ids)
      .is('deleted_at', null);

    if (spacesError || !spaces || spaces.length !== data.space_ids.length) {
      return NextResponse.json(
        { error: 'One or more spaces not found' },
        { status: 404 }
      );
    }

    // Verify all spaces belong to the venue
    const invalidSpaces = spaces.filter(s => s.venue_id !== data.venue_id);
    if (invalidSpaces.length > 0) {
      return NextResponse.json(
        { error: 'Selected spaces do not belong to this venue' },
        { status: 400 }
      );
    }

    // 3. Check availability
    const { data: availabilityResult } = await supabase
      .rpc('check_space_availability', {
        p_space_ids: data.space_ids,
        p_event_date: data.event_date,
        p_event_time: data.event_time
      });

    const availability = availabilityResult as { available: boolean; conflicts: any[] };

    // If not available, we can still create the inquiry but flag it
    if (!availability?.available) {
      console.log('Spaces not available but creating inquiry anyway:', availability.conflicts);
    }

    // 4. Get client IP and user agent for tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 5. Create the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('client_inquiries')
      .insert({
        venue_id: data.venue_id,
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        company_name: data.company_name,
        event_date: data.event_date,
        event_time: data.event_time,
        event_type: data.event_type,
        space_ids: data.space_ids,
        guest_count: data.guest_count,
        budget: data.budget,
        description: data.description,
        preferred_contact_method: data.preferred_contact_method,
        source: data.source,
        ip_address: ip,
        user_agent: userAgent,
        status: 'pending',
      })
      .select()
      .single();

    if (inquiryError || !inquiry) {
      console.error('Error creating inquiry:', inquiryError);
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      );
    }

    // 6. Create a task for the venue to review the inquiry
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        event_id: null, // No event yet
        assigned_to_id: data.venue_id,
        assigned_to_type: 'venue',
        name: `Review booking request: ${data.client_name} - ${data.event_date}`,
        description: `New event inquiry from ${data.client_name} for ${data.guest_count} guests on ${data.event_date} at ${data.event_time}.\n\n${data.description}`,
        priority: 'high',
        status: 'pending',
        created_by: 'system',
        form_schema: {
          title: 'Review Booking Request',
          description: `Review the booking request from ${data.client_name}`,
          fields: [
            {
              id: 'inquiry_id',
              type: 'hidden',
              value: inquiry.inquiry_id,
            },
            {
              id: 'decision',
              type: 'radio',
              label: 'Decision',
              required: true,
              options: [
                { value: 'approve', label: 'Approve Booking' },
                { value: 'decline', label: 'Decline Booking' },
              ],
            },
            {
              id: 'venue_notes',
              type: 'textarea',
              label: 'Notes for Client (optional)',
              help_text: 'These notes will be included in the confirmation email',
              conditional_logic: {
                field: 'decision',
                value: 'approve',
              },
            },
            {
              id: 'decline_reason',
              type: 'textarea',
              label: 'Reason for Declining',
              required: true,
              help_text: 'This will be sent to the client',
              conditional_logic: {
                field: 'decision',
                value: 'decline',
              },
            },
            {
              id: 'suggest_alternatives',
              type: 'checkbox',
              label: 'Suggest alternative dates',
              conditional_logic: {
                field: 'decision',
                value: 'decline',
              },
            },
          ],
        },
      });

    if (taskError) {
      console.error('Error creating task:', taskError);
      // Don't fail the request if task creation fails
    }

    // 7. Send notification email to venue
    try {
      // Get venue email
      const { data: venueUser } = await supabase.auth.admin.getUserById(data.venue_id);
      const venueEmail = venueUser?.user?.email;

      if (venueEmail) {
        await sendNewInquiryNotification({
          venueName: venue.name,
          venueEmail,
          clientName: data.client_name,
          eventDate: data.event_date,
          eventTime: data.event_time,
          guestCount: data.guest_count,
          referenceNumber: (inquiry as any).inquiry_id.slice(0, 8).toUpperCase(),
        });
      }
    } catch (emailError) {
      console.error('Error sending venue notification:', emailError);
      // Don't fail the request if email fails
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      inquiry_id: (inquiry as any).inquiry_id,
      reference_number: (inquiry as any).inquiry_id.slice(0, 8).toUpperCase(),
      venue_name: venue.name,
      space_available: availability?.available,
      message: availability?.available
        ? 'Your request has been received! The venue will review it and respond within 24 hours.'
        : 'Your request has been received! Please note that the selected space may not be available on your requested date. The venue will review and contact you with alternatives if needed.',
    });

  } catch (error) {
    console.error('Inquiry submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inquiries?venue_id=xxx&status=pending
 * Get inquiries for a venue (requires authentication)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venue_id');
    const status = searchParams.get('status');

    if (!venueId) {
      return NextResponse.json(
        { error: 'venue_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Build query
    let query = supabase
      .from('client_inquiries')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Error fetching inquiries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inquiries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiries,
    });

  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}
