import { NextResponse } from "next/server";

// Handle POST /api/auth/magic-link requests to trigger Supabase email OTP flow.
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Validate payload with Zod and call lib/auth/magicLink.ts helpers.
  return NextResponse.json({ status: "pending", email: body?.email ?? null });
}
