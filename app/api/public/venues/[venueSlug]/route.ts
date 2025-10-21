import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/public/venues/[venueSlug]
 * Public endpoint to fetch venue information and available spaces
 * Used by the public booking inquiry form
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ venueSlug: string }> }
) {
  try {
    const { venueSlug } = await params;
    const supabase = createServiceClient();

    // In a real implementation, you'd query by a slug field
    // For now, we'll treat venueSlug as the venue_id
    // TODO: Add a slug field to venues table and query by that instead

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('venue_id, name, description, address')
      .eq('venue_id', venueSlug)
      .is('deleted_at', null)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Fetch spaces for this venue
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('space_id, name, description, capacity, main_image_url')
      .eq('venue_id', venue.venue_id)
      .is('deleted_at', null)
      .order('name');

    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
      return NextResponse.json(
        { error: 'Failed to fetch venue spaces' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      venue,
      spaces: spaces || [],
    });

  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue information' },
      { status: 500 }
    );
  }
}
