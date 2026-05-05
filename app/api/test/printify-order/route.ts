import { NextResponse } from "next/server";
import {
  createPrintifyOrder,
  getProduct,
} from "@/lib/printify/helpers";
import { getProductById } from "@/lib/supabase/queries/products";
import { resolveVariantIdForProduct } from "@/lib/printify/variants";

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

interface TestItem {
  productId: string;
  size: string;
  color?: string;
  quantity: number;
  artworkUrl?: string;
  artworkSide?: "front" | "back";
}

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as { items: TestItem[] };

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const artworkUrl = items.find((i) => i.artworkUrl)?.artworkUrl;
    if (!artworkUrl) {
      return NextResponse.json(
        { error: "No artwork found. Customize your design before ordering." },
        { status: 400 }
      );
    }

    const lineItems = (
      await Promise.all(
        items.map(async (item) => {
          const { data: dbProduct } = await getProductById(item.productId);
          if (!dbProduct) {
            console.warn(`[test-printify] No DB product for id ${item.productId}`);
            return null;
          }
          const printifyProductId = dbProduct.printifyBlueprintId;

          const pfyProduct = (await getProduct(printifyProductId)) as {
            blueprint_id: number;
            print_provider_id: number;
          };

          const variantId = resolveVariantIdForProduct(
            printifyProductId,
            item.size,
            item.color
          );
          if (!variantId) {
            console.warn(`[test-printify] No variant for ${printifyProductId} ${item.color} ${item.size}`);
            return null;
          }

          const side = item.artworkSide ?? "front";
          return {
            blueprint_id: pfyProduct.blueprint_id,
            print_provider_id: pfyProduct.print_provider_id,
            variant_id: variantId,
            quantity: item.quantity,
            print_areas: { [side]: artworkUrl } as Record<string, string>,
          };
        })
      )
    ).filter((li): li is NonNullable<typeof li> => li !== null);

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: "No valid variants found for the given items" },
        { status: 400 }
      );
    }

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
