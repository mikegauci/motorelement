/**
 * Maps Printify product IDs to their color+size → variant-ID tables.
 * Each product has its own map; the resolver picks the right one at runtime.
 */

type Size = "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";
type VariantMap = Record<string, Record<Size, number>>;

// ── Gildan Softstyle 64000 (Classic Tee) ────────────────────────────
export const TEE_PRODUCT_ID = "69d74f3460816e829603d93f";

const TEE_VARIANTS: VariantMap = {
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

// ── Gildan 18500 Heavy Blend Hoodie ─────────────────────────────────
export const HOODIE_PRODUCT_ID = "69d8c3476246f29b190f7d9e";

const HOODIE_VARIANTS: VariantMap = {
  "dark-heather": {
    S: 32878, M: 32879, L: 32880, XL: 32881,
    "2XL": 32882, "3XL": 32883, "4XL": 32884, "5XL": 32885,
  },
  navy: {
    S: 32894, M: 32895, L: 32896, XL: 32897,
    "2XL": 32898, "3XL": 32899, "4XL": 32900, "5XL": 32901,
  },
  white: {
    S: 32910, M: 32911, L: 32912, XL: 32913,
    "2XL": 32914, "3XL": 32915, "4XL": 32916, "5XL": 32917,
  },
  black: {
    S: 32918, M: 32919, L: 32920, XL: 32921,
    "2XL": 32922, "3XL": 32923, "4XL": 32924, "5XL": 32925,
  },
};

// ── Registry ────────────────────────────────────────────────────────

const PRODUCT_VARIANTS: Record<string, { map: VariantMap; defaultColor: string }> = {
  [TEE_PRODUCT_ID]: { map: TEE_VARIANTS, defaultColor: "black" },
  [HOODIE_PRODUCT_ID]: { map: HOODIE_VARIANTS, defaultColor: "black" },
};

/** @deprecated Use `resolveVariantIdForProduct` for multi-product support. */
export const PRINTIFY_PRODUCT_ID = TEE_PRODUCT_ID;

/**
 * Resolve a Printify variant ID given a product, size, and optional color.
 * Falls back to the product's default color if `color` is omitted or unknown.
 */
export function resolveVariantIdForProduct(
  printifyProductId: string,
  size: string,
  color?: string
): number | null {
  const entry = PRODUCT_VARIANTS[printifyProductId];
  if (!entry) return null;

  const normalizedColor = color?.toLowerCase().replace(/\s+/g, "-") ?? entry.defaultColor;
  const normalizedSize = size.toUpperCase() as Size;

  const colorMap = entry.map[normalizedColor] ?? entry.map[entry.defaultColor];
  if (!colorMap) return null;
  return colorMap[normalizedSize] ?? null;
}

/** @deprecated Use `resolveVariantIdForProduct`. Kept for backward compat. */
export function resolveVariantId(
  size: string,
  color?: string
): number | null {
  return resolveVariantIdForProduct(TEE_PRODUCT_ID, size, color);
}
