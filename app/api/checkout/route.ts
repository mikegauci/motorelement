import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/helpers";

export async function POST(request: Request) {
  const body = await request.json();
  const { items, customerId } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";

  try {
    const session = await createCheckoutSession({
      items,
      customerId,
      origin,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
