import { createClient } from '@/lib/supabase/server';
import { getClientEvent } from '@/lib/db/clients';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_error', requestUrl.origin)
      );
    }

    if (data.user) {
      const userType = data.user.user_metadata?.user_type || 'client';

      // If user has explicitly set a 'next' parameter, use that
      if (next !== '/') {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      // For clients, redirect to their event page if they have exactly one event
      // If they have multiple events (or none), redirect to dashboard
      if (userType === 'client') {
        try {
          const event = await getClientEvent(supabase, data.user.id);
          if (event) {
            // Client has exactly one event - redirect to that event page
            return NextResponse.redirect(new URL(`/client/events/${event.event_id}`, requestUrl.origin));
          } else {
            // Client has 0 or multiple events - redirect to dashboard
            return NextResponse.redirect(new URL('/client/dashboard', requestUrl.origin));
          }
        } catch (err) {
          console.error('Error fetching client event:', err);
          // Fall through to default redirect
        }
      }

      // Default: redirect to user type base route
      return NextResponse.redirect(new URL(`/${userType}`, requestUrl.origin));
    }
  }

  // If no code or something went wrong, redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
