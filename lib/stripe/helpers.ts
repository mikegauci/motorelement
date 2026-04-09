import { getStripe } from "./client";
import type { CartItem } from "@/hooks/useCart";

export async function createCheckoutSession({
  items,
  customerId,
  artworkUrl,
  origin,
}: {
  items: CartItem[];
  customerId?: string;
  artworkUrl?: string;
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

  const metadata: Record<string, string> = {};
  if (customerId) metadata.customerId = customerId;
  if (artworkUrl) metadata.artworkUrl = artworkUrl;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: [
        "US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "AT",
        "BE", "CH", "SE", "DK", "NO", "FI", "IE", "PT", "NZ", "MT",
      ],
    },
    success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata,
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });
}
