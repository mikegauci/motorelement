import { NextResponse } from "next/server";

// TODO: verify Stripe webhook signature and handle events
export async function POST() {
  return NextResponse.json({ received: true });
}
