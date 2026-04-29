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

  // Per-line-item metadata: front/back artwork URLs travel here so the Stripe
  // webhook can route each item's prints to the correct Printify print_areas.
  // Stripe metadata is per-product, with a 500-char limit per value.
  const lineItems = items.map((item) => {
    const productMetadata: Record<string, string> = {
      productId: item.productId,
      size: item.size,
      color: item.color,
      type: item.type,
    };
    if (item.frontArtworkUrl) productMetadata.frontArtworkUrl = item.frontArtworkUrl;
    if (item.backArtworkUrl) productMetadata.backArtworkUrl = item.backArtworkUrl;

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          metadata: productMetadata,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    };
  });

  const metadata: Record<string, string> = {};
  if (customerId) metadata.customerId = customerId;

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
