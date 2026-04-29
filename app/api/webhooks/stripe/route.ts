import { NextResponse } from "next/server";
import { getStripe, Stripe } from "@/lib/stripe/client";
import {
  createOrder,
  updateOrderPrintifyId,
} from "@/lib/supabase/queries/orders";
import { getProductById } from "@/lib/supabase/queries/products";
import { createPrintifyOrder } from "@/lib/printify/helpers";
import { resolveVariantIdForProduct } from "@/lib/printify/variants";

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

      const stripeLineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        { expand: ["data.price.product"] }
      );

      const items = stripeLineItems.data.map((item) => {
        const product = item.price?.product;
        const meta =
          typeof product === "object" && product && "metadata" in product
            ? (product as { metadata: Record<string, string> }).metadata
            : {};
        return {
          productId: meta.productId ?? "",
          quantity: item.quantity ?? 1,
          size: meta.size ?? "default",
          color: meta.color ?? "",
          price: item.amount_total,
          frontArtworkUrl: meta.frontArtworkUrl,
          backArtworkUrl: meta.backArtworkUrl,
        };
      });

      // 1. Save order in Supabase
      const { data: supabaseOrder } = await createOrder({
        customerId: customerId ?? "anonymous",
        total: session.amount_total ?? 0,
        stripePaymentId: session.payment_intent as string,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          size: it.size,
          color: it.color,
          price: it.price,
        })),
      });

      // 2. Submit to Printify if any item has artwork and we have a shipping address.
      const shipping = session.collected_information?.shipping_details;
      const hasAnyArtwork = items.some((it) => it.frontArtworkUrl || it.backArtworkUrl);
      if (hasAnyArtwork && shipping?.address && supabaseOrder) {
        try {
          const addr = shipping.address;
          const name = shipping.name ?? "";
          const [firstName, ...lastParts] = name.split(" ");

          // Look up Printify product ID per cart item from Supabase
          const printifyLineItems = (
            await Promise.all(
              items.map(async (item) => {
                if (!item.frontArtworkUrl && !item.backArtworkUrl) return null;
                const { data: dbProduct } = await getProductById(item.productId);
                if (!dbProduct) {
                  console.warn(`[stripe-webhook] No DB product for id ${item.productId}`);
                  return null;
                }
                const printifyProductId = dbProduct.printifyBlueprintId;
                const variantId = resolveVariantIdForProduct(
                  printifyProductId,
                  item.size,
                  item.color || undefined
                );
                if (!variantId) {
                  console.warn(
                    `[stripe-webhook] No variant for ${printifyProductId} ${item.color} ${item.size}`
                  );
                  return null;
                }
                const print_areas: Record<string, string> = {};
                if (item.frontArtworkUrl) print_areas.front = item.frontArtworkUrl;
                if (item.backArtworkUrl) print_areas.back = item.backArtworkUrl;
                return {
                  product_id: printifyProductId,
                  variant_id: variantId,
                  quantity: item.quantity,
                  print_areas,
                };
              })
            )
          ).filter(Boolean) as Array<{
            product_id: string;
            variant_id: number;
            quantity: number;
            print_areas: Record<string, string>;
          }>;

          if (printifyLineItems.length > 0) {
            const printifyOrder = await createPrintifyOrder({
              externalId: supabaseOrder.id,
              lineItems: printifyLineItems,
              address: {
                first_name: firstName ?? "",
                last_name: lastParts.join(" ") || "",
                email: session.customer_details?.email ?? "",
                country: addr.country ?? "US",
                region: addr.state ?? "",
                address1: addr.line1 ?? "",
                address2: addr.line2 ?? "",
                city: addr.city ?? "",
                zip: addr.postal_code ?? "",
              },
            });

            await updateOrderPrintifyId(supabaseOrder.id, printifyOrder.id);
            console.log(
              "[stripe-webhook] Printify order created:",
              printifyOrder.id
            );
          }
        } catch (err) {
          console.error(
            "[stripe-webhook] Printify order failed:",
            err instanceof Error ? err.message : err
          );
        }
      }

      console.log("[stripe-webhook] checkout.session.completed:", session.id);
      break;
    }

    default:
      console.log("[stripe-webhook] Unhandled event:", event.type);
  }

  return NextResponse.json({ received: true });
}
