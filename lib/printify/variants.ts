/**
 * Maps color + size to Printify variant IDs for the Custom T-shirt product.
 * Product: Gildan Softstyle 64000 (ID: 69d74f3460816e829603d93f)
 */

export const PRINTIFY_PRODUCT_ID = "69d74f3460816e829603d93f";

type Color = "white" | "black" | "navy" | "sport-grey";
type Size = "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";

const VARIANT_MAP: Record<Color, Record<Size, number>> = {
  white: {
    S: 38163, M: 38177, L: 38191, XL: 38205,
    "2XL": 38219, "3XL": 42120, "4XL": 66211, "5XL": 95175,
  },
  black: {
    S: 38164, M: 38178, L: 38192, XL: 38206,
    "2XL": 38220, "3XL": 42122, "4XL": 66213, "5XL": 95180,
  },
  navy: {
    S: 38158, M: 38172, L: 38186, XL: 38200,
    "2XL": 38214, "3XL": 42115, "4XL": 66203, "5XL": 95166,
  },
  "sport-grey": {
    S: 38162, M: 38176, L: 38190, XL: 38204,
    "2XL": 38218, "3XL": 42119, "4XL": 66210, "5XL": 95176,
  },
};

const DEFAULT_COLOR: Color = "black";

export function resolveVariantId(
  size: string,
  color?: string
): number | null {
  const normalizedColor = (color?.toLowerCase().replace(/\s+/g, "-") ??
    DEFAULT_COLOR) as Color;
  const normalizedSize = size.toUpperCase() as Size;

  const colorMap = VARIANT_MAP[normalizedColor] ?? VARIANT_MAP[DEFAULT_COLOR];
  return colorMap[normalizedSize] ?? null;
}

export function getAvailableColors(): Color[] {
  return Object.keys(VARIANT_MAP) as Color[];
}

export function getAvailableSizes(): Size[] {
  return ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
}
