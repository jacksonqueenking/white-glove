import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected routes
  const isClientRoute = pathname.startsWith('/client') && !pathname.startsWith('/client/confirm');
  const isVenueRoute = pathname.startsWith('/venue') && !pathname.startsWith('/venue/register');
  const isVendorRoute = pathname.startsWith('/vendor') && !pathname.startsWith('/vendor/register');
  const isProtectedRoute = isClientRoute || isVenueRoute || isVendorRoute;

  // Auth routes
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // If trying to access protected route without authentication
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);

    // Determine user type from path
    let userType = 'client';
    if (isVenueRoute) userType = 'venue';
    if (isVendorRoute) userType = 'vendor';

    loginUrl.searchParams.set('type', userType);
    loginUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access auth pages, redirect to base route
  if (isAuthRoute && user) {
    const userType = user.user_metadata?.user_type || 'client';
    return NextResponse.redirect(new URL(`/${userType}`, request.url));
  }

  // Check role-based access
  if (user && isProtectedRoute) {
    const userType = user.user_metadata?.user_type;

    // Ensure user is accessing the correct role's routes
    if (
      (isClientRoute && userType !== 'client') ||
      (isVenueRoute && userType !== 'venue') ||
      (isVendorRoute && userType !== 'vendor')
    ) {
      // Redirect to their correct base route
      return NextResponse.redirect(new URL(`/${userType}`, request.url));
    }
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (let them handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
