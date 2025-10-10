import { NextResponse } from "next/server";

// Initiate Stripe Checkout sessions for event payments.
export async function POST(request: Request) {
  const payload = await request.json();
  // TODO: Use lib/payments/stripe.ts to create checkout sessions respecting payment schedules.
  return NextResponse.json({ checkoutUrl: "https://stripe.example/session", payload });
}
