import { NextResponse } from "next/server";

// Handle Stripe webhook events for payment updates and payouts.
export async function POST(request: Request) {
  const rawBody = await request.text();
  // TODO: Verify signature, parse event, and update payment status via lib/payments/stripe.ts.
  return NextResponse.json({ received: true, rawBodyLength: rawBody.length });
}
