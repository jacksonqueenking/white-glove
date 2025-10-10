import { NextResponse } from "next/server";

// Handle POST /api/auth/password for password-based sign-in or sign-up.
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Call lib/auth/password.ts to complete Supabase sign-in/up logic.
  return NextResponse.json({ status: "pending", email: body?.email ?? null });
}
