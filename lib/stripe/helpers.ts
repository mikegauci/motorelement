import { getStripe } from "./client";
import type { CartItem } from "@/hooks/useCart";

export async function createCheckoutSession({
  items,
  customerId,
  origin,
}: {
  items: CartItem[];
  customerId?: string;
  origin: string;
}) {
  const stripe = getStripe();

  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        metadata: {
          productId: item.productId,
          size: item.size,
          type: item.type,
        },
      },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: customerId ? { customerId } : undefined,
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });
}
