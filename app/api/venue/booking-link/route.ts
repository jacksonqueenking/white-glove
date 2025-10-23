import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/venue/booking-link
 * Returns the venue's public booking page URL
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get venue details (including slug if it exists)
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('venue_id, name, slug')
      .eq('venue_id', user.id)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Use slug if available, otherwise use venue_id
    const identifier = (venue as any).slug || (venue as any).venue_id;
    const bookingUrl = `${process.env.NEXT_PUBLIC_URL}/book/${identifier}`;

    return NextResponse.json({
      bookingUrl,
      identifier,
      useSlug: !!(venue as any).slug,
      venueName: (venue as any).name,
    });

  } catch (error) {
    console.error('Error getting booking link:', error);
    return NextResponse.json(
      { error: 'Failed to get booking link' },
      { status: 500 }
    );
  }
}
