import { NextResponse } from 'next/server';
import { signInWithPassword, signUpWithPassword } from '@/lib/auth/helpers';
import { loginSchema, signupSchema } from '@/lib/auth/validation';

/**
 * POST /api/auth/password?action=login
 * Sign in with email and password
 *
 * POST /api/auth/password?action=signup
 * Sign up with email and password
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'login';

    const body = await request.json();

    if (action === 'login') {
      // Validate login request
      const validation = loginSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { email, password } = validation.data;

      // Sign in
      const result = await signInWithPassword(email, password);

      if (result.error) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: result.data?.user,
        session: {
          expires_at: result.data?.expires_at,
          expires_in: result.data?.expires_in,
        },
      });
    } else if (action === 'signup') {
      // Validate signup request
      const validation = signupSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { email, password, name, userType } = validation.data;

      // Sign up
      const result = await signUpWithPassword(
        email,
        password,
        userType,
        name
      );

      if (result.error) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        user: result.data?.user,
        message: 'Account created successfully. Please check your email to verify.',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Password auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
