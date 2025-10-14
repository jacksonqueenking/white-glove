import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/invitations/[token]
 * Retrieve invitation details by token (for displaying on confirmation pages)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token' as any, token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if ((invitation as any).status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      );
    }

    if (new Date((invitation as any).expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' } as any)
        .eq('invitation_id' as any, (invitation as any).invitation_id);

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Return invitation data
    return NextResponse.json({
      invitee_email: (invitation as any).invitee_email,
      invitation_type: (invitation as any).invitation_type,
      metadata: (invitation as any).metadata || {},
    });
  } catch (error) {
    console.error('Invitation lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invitation' },
      { status: 500 }
    );
  }
}
