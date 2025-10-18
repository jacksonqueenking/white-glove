import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientEvent } from '@/lib/db/clients';

/**
 * GET /api/client/event
 * Get the current client's primary event
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a client
    const userType = user.user_metadata?.user_type;
    if (userType !== 'client') {
      return NextResponse.json(
        { error: 'Not a client user' },
        { status: 403 }
      );
    }

    // Get the client's event
    const event = await getClientEvent(supabase, user.id);

    if (!event) {
      return NextResponse.json(
        { event: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { event },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching client event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
