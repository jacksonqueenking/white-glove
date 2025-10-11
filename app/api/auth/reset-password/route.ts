import { NextResponse } from 'next/server';
import {
  sendPasswordResetEmail,
  updatePassword,
} from '@/lib/auth/helpers';
import {
  passwordResetRequestSchema,
  passwordResetSchema,
} from '@/lib/auth/validation';

/**
 * POST /api/auth/reset-password?action=request
 * Request password reset email
 *
 * POST /api/auth/reset-password?action=reset
 * Reset password with new password
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    const body = await request.json();

    if (action === 'request') {
      // Validate request
      const validation = passwordResetRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { email } = validation.data;

      // Send reset email
      const result = await sendPasswordResetEmail(email);

      if (result.error) {
        // Don't reveal if email exists or not for security
        return NextResponse.json({
          success: true,
          message: 'If an account exists with that email, you will receive a password reset link.',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Check your email for the password reset link',
      });
    } else if (action === 'reset') {
      // Validate request
      const validation = passwordResetSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { password } = validation.data;

      // Update password
      const result = await updatePassword(password);

      if (result.error) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=request or ?action=reset' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    );
  }
}
