import { createClient } from '@/lib/supabase/server';
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
      // Redirect to the appropriate dashboard based on user type
      const userType = data.user.user_metadata?.user_type || 'client';
      const redirectTo = next !== '/' ? next : `/${userType}/dashboard`;

      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
    }
  }

  // If no code or something went wrong, redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
