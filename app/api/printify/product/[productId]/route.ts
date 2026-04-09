import { NextResponse } from "next/server";
import { printifyFetch, shopPath } from "@/lib/printify/client";

interface PrintifyVariant {
  id: number;
  title: string;
  price: number;
  is_enabled: boolean;
  is_available: boolean;
  options: number[];
}

interface PrintifyOptionValue {
  id: number;
  title: string;
  colors?: string[];
}

interface PrintifyOption {
  name: string;
  type: string;
  values: PrintifyOptionValue[];
}

interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
}

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: PrintifyImage[];
  variants: PrintifyVariant[];
  options: PrintifyOption[];
}

export async function GET(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const product = await printifyFetch<PrintifyProduct>(
      shopPath(`/products/${params.productId}.json`)
    );

    const colorsOption = product.options.find((o) => o.name === "Colors");
    const sizesOption = product.options.find((o) => o.name === "Sizes");

    const colorValueIds = new Set((colorsOption?.values ?? []).map((v) => v.id));
    const sizeValueIds = new Set((sizesOption?.values ?? []).map((v) => v.id));

    const colors = (colorsOption?.values ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      hex: v.colors?.[0] ?? "#888888",
    }));

    const sizes = (sizesOption?.values ?? []).map((v) => ({
      id: v.id,
      title: v.title,
    }));

    // variant.options order is not consistent — classify each value
    // by checking which option set it belongs to
    const enabledVariants = product.variants
      .filter((v) => v.is_enabled && v.is_available)
      .map((v) => {
        let colorId = 0;
        let sizeId = 0;
        for (const optId of v.options) {
          if (colorValueIds.has(optId)) colorId = optId;
          else if (sizeValueIds.has(optId)) sizeId = optId;
        }
        return { id: v.id, title: v.title, price: v.price, colorId, sizeId };
      });

    // Enabled color/size IDs (only include options that have at least one enabled variant)
    const enabledColorIds = new Set(enabledVariants.map((v) => v.colorId));
    const enabledSizeIds = new Set(enabledVariants.map((v) => v.sizeId));

    const activeColors = colors.filter((c) => enabledColorIds.has(c.id));
    const activeSizes = sizes.filter((s) => enabledSizeIds.has(s.id));

    // Build image map: colorId -> { front, back, other[] }
    const colorImages: Record<
      number,
      { front: string | null; back: string | null; other: string[] }
    > = {};

    for (const color of activeColors) {
      colorImages[color.id] = { front: null, back: null, other: [] };
    }

    for (const img of product.images) {
      // Find which color this image belongs to by checking variant_ids
      const matchedVariant = enabledVariants.find((v) =>
        img.variant_ids.includes(v.id)
      );
      if (!matchedVariant) continue;

      const colorId = matchedVariant.colorId;
      if (!colorImages[colorId]) continue;

      if (img.position === "front" && !colorImages[colorId].front) {
        colorImages[colorId].front = img.src;
      } else if (img.position === "back" && !colorImages[colorId].back) {
        colorImages[colorId].back = img.src;
      } else if (img.position === "other") {
        if (colorImages[colorId].other.length < 4) {
          colorImages[colorId].other.push(img.src);
        }
      }
    }

    return NextResponse.json({
      id: product.id,
      title: product.title,
      description: product.description,
      colors: activeColors,
      sizes: activeSizes,
      variants: enabledVariants,
      images: colorImages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
