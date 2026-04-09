import { NextResponse } from "next/server";
import { getStripe, Stripe } from "@/lib/stripe/client";
import { createOrder } from "@/lib/supabase/queries/orders";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.metadata?.customerId;

      if (customerId) {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        const items = lineItems.data.map((item) => ({
          productId: item.price?.product as string,
          quantity: item.quantity ?? 1,
          size: "default",
          price: item.amount_total,
        }));

        await createOrder({
          customerId,
          total: session.amount_total ?? 0,
          items,
        });
      }

      console.log("[stripe-webhook] checkout.session.completed:", session.id);
      break;
    }

    default:
      console.log("[stripe-webhook] Unhandled event:", event.type);
  }

  return NextResponse.json({ received: true });
}
