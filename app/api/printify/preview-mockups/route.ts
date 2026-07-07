export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { resolveMockProductVariantId } from "@/lib/printify/resolveMockProductVariant";
import { renderMockProductPreview } from "@/lib/printify/syncMockups";
import { assertSupabasePublicArtworkUrl } from "@/lib/printify/validatePreviewAssetUrl";
import { getProductBySlug } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

interface BodyJson {
  shopProductId?: string;
  productSlug?: string;
  variantId?: number;
  printFileUrls?: Partial<Record<"front" | "back", string>>;
}

export async function POST(request: Request) {
  try {
    const mockProductId = process.env.PRINTIFY_MOCKUP_PRODUCT_ID?.trim();
    if (!mockProductId) {
      return NextResponse.json(
        { error: "PRINTIFY_MOCKUP_PRODUCT_ID is not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as BodyJson;
    let listingProductId = body.shopProductId?.trim() ?? "";
    const listingVariantId = body.variantId;
    const printFileUrls = body.printFileUrls ?? {};

    if (body.productSlug?.trim()) {
      const { data: dbProduct } = await getProductBySlug(body.productSlug.trim());
      if (dbProduct?.printifyBlueprintId) {
        listingProductId = dbProduct.printifyBlueprintId;
      }
    }

    if (
      !listingProductId ||
      typeof listingVariantId !== "number" ||
      !Number.isFinite(listingVariantId)
    ) {
      return NextResponse.json(
        { error: "shopProductId and numeric variantId are required" },
        { status: 400 },
      );
    }

    const sanitized: Partial<Record<"front" | "back", string>> = {};
    if (printFileUrls.front) {
      assertSupabasePublicArtworkUrl(printFileUrls.front);
      sanitized.front = printFileUrls.front;
    }
    if (printFileUrls.back) {
      assertSupabasePublicArtworkUrl(printFileUrls.back);
      sanitized.back = printFileUrls.back;
    }

    if (!sanitized.front && !sanitized.back) {
      return NextResponse.json(
        { error: "Provide at least one of printFileUrls.front or printFileUrls.back" },
        { status: 400 },
      );
    }

    const mockVariantId = await resolveMockProductVariantId({
      listingProductId,
      listingVariantId,
      mockProductId,
    });

    const { mockups } = await renderMockProductPreview({
      mockProductId,
      variantId: mockVariantId,
      printFileUrls: sanitized,
    });

    return NextResponse.json(
      {
        mockups,
        shopProductUsed: mockProductId,
        variantIdUsed: mockVariantId,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[preview-mockups]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
