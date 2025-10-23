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

    // Try to find venue by slug first, fallback to venue_id for backwards compatibility
    let query = supabase
      .from('venues')
      .select('venue_id, name, description, address, slug')
      .is('deleted_at', null);

    // Check if it looks like a UUID (venue_id) or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(venueSlug);

    if (isUUID) {
      query = query.eq('venue_id', venueSlug);
    } else {
      query = query.eq('slug', venueSlug);
    }

    const { data: venue, error: venueError } = await query.single();

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
      .eq('venue_id', (venue as any).venue_id)
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
