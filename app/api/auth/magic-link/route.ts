import { NextResponse } from 'next/server';
import { sendMagicLink } from '@/lib/auth/helpers';
import { magicLinkSchema } from '@/lib/auth/validation';
import {
  applyRateLimit,
  magicLinkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  isRateLimited,
} from '@/lib/redis/rate-limit';

/**
 * POST /api/auth/magic-link
 * Send magic link for passwordless authentication
 */
export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await applyRateLimit(magicLinkRateLimit, identifier);

    if (isRateLimited(rateLimitResult)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json();

    // Validate request
    const validation = magicLinkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { email, userType, redirectTo } = validation.data;

    // Send magic link
    const result = await sendMagicLink(email, userType, redirectTo);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Magic link sent! Check your email.',
        email: result.data?.email,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}
