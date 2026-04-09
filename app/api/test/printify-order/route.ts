import { NextResponse } from "next/server";
import {
  uploadImage,
  createPrintifyOrder,
  getProduct,
} from "@/lib/printify/helpers";
import { PRINTIFY_PRODUCT_ID, resolveVariantId } from "@/lib/printify/variants";

const TEST_ADDRESS = {
  first_name: "Test",
  last_name: "Order",
  email: "test@motorelement.com",
  country: "US",
  region: "CA",
  address1: "123 Test Street",
  city: "Los Angeles",
  zip: "90001",
};

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const artworkUrl = items.find(
      (i: { artworkUrl?: string }) => i.artworkUrl
    )?.artworkUrl as string | undefined;

    if (!artworkUrl) {
      return NextResponse.json(
        { error: "No artwork found. Customize your design before ordering." },
        { status: 400 }
      );
    }

    // 1. Fetch the existing product to get blueprint_id and print_provider_id
    const product = (await getProduct(PRINTIFY_PRODUCT_ID)) as {
      blueprint_id: number;
      print_provider_id: number;
    };
    console.log(
      `[test-printify] Blueprint: ${product.blueprint_id}, Provider: ${product.print_provider_id}`
    );

    // 2. Upload customer artwork to Printify
    console.log("[test-printify] Uploading customer artwork...");
    const image = await uploadImage(artworkUrl, "customer-artwork.png");
    console.log("[test-printify] Image uploaded:", image.id);

    // 3. Build line items using on-the-fly product creation format
    //    (blueprint_id + print_provider_id instead of product_id)
    const lineItems = items
      .map((item: { size: string; quantity: number }) => {
        const variantId = resolveVariantId(item.size);
        if (!variantId) {
          console.warn(`[test-printify] No variant for size: ${item.size}`);
          return null;
        }
        return {
          blueprint_id: product.blueprint_id,
          print_provider_id: product.print_provider_id,
          variant_id: variantId,
          quantity: item.quantity,
          print_areas: { front: image.preview_url },
        };
      })
      .filter(Boolean);

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: "No valid variants found for the given sizes" },
        { status: 400 }
      );
    }

    // 4. Create the order (on-the-fly product creation)
    console.log("[test-printify] Creating Printify order...");
    const order = await createPrintifyOrder({
      externalId: `test-${Date.now()}`,
      lineItems,
      address: TEST_ADDRESS,
    });

    console.log("[test-printify] Order created:", order.id);

    return NextResponse.json({
      success: true,
      printifyOrderId: order.id,
      status: order.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[test-printify] Failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
