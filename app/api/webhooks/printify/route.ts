import { NextResponse } from "next/server";

// TODO: handle Printify webhook events (order shipped, etc.)
export async function POST() {
  return NextResponse.json({ received: true });
}
