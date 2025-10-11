import { NextResponse } from 'next/server';
import { signOut } from '@/lib/auth/helpers';

/**
 * POST /api/auth/logout
 * Sign out the current user
 */
export async function POST() {
  try {
    const result = await signOut();

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
