import { NextResponse } from "next/server";
import { printifyFetch, shopPath } from "@/lib/printify/client";

export const dynamic = "force-dynamic";

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

type ImageBucket = { front: string | null; back: string | null; other: string[] };

const COLORLESS_IMAGE_KEY = 0;

function isSizesOption(name: string) {
  const n = name.toLowerCase();
  return n === "sizes" || n === "size";
}

function isColorsOption(name: string) {
  return name.toLowerCase() === "colors" || name.toLowerCase() === "color";
}

function ensureBucket(
  map: Record<number, ImageBucket>,
  key: number
): ImageBucket {
  if (!map[key]) {
    map[key] = { front: null, back: null, other: [] };
  }
  return map[key];
}

function assignImage(bucket: ImageBucket, img: PrintifyImage) {
  if (img.position === "front" && !bucket.front) {
    bucket.front = img.src;
  } else if (img.position === "back" && !bucket.back) {
    bucket.back = img.src;
  } else if (img.position === "other") {
    if (bucket.other.length < 4) {
      bucket.other.push(img.src);
    }
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const product = await printifyFetch<PrintifyProduct>(
      shopPath(`/products/${params.productId}.json`)
    );

    const colorsOption = product.options.find((o) => isColorsOption(o.name));
    const sizesOption = product.options.find((o) => isSizesOption(o.name));

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

    const enabledColorIds = new Set(enabledVariants.map((v) => v.colorId));
    const enabledSizeIds = new Set(enabledVariants.map((v) => v.sizeId));

    const activeColors = colors.filter((c) => enabledColorIds.has(c.id));
    const activeSizes = sizes.filter((s) => enabledSizeIds.has(s.id));
    const hasColors = activeColors.length > 0;

    const colorImages: Record<number, ImageBucket> = {};

    if (hasColors) {
      for (const color of activeColors) {
        ensureBucket(colorImages, color.id);
      }
    } else {
      ensureBucket(colorImages, COLORLESS_IMAGE_KEY);
    }

    for (const img of product.images) {
      const matchedVariant = enabledVariants.find((v) =>
        img.variant_ids.includes(v.id)
      );
      if (!matchedVariant) continue;

      const key = hasColors ? matchedVariant.colorId : COLORLESS_IMAGE_KEY;
      const bucket = colorImages[key];
      if (!bucket) continue;
      assignImage(bucket, img);
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
