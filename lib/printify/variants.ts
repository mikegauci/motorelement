/**
 * Maps Printify product IDs to their color+size → variant-ID tables.
 * Each product has its own map; the resolver picks the right one at runtime.
 */

type Size = "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";
type VariantMap = Record<string, Record<Size, number>>;

// ── Gildan 5000 Heavy Cotton (Classic Tee) ────────────────────────────
const TEE_PRODUCT_ID = "6a4d1b5c6c67e7b25505eece";

const TEE_VARIANTS: VariantMap = {
  white: {
    S: 12102, M: 12101, L: 12100, XL: 12103,
    "2XL": 12104, "3XL": 12105, "4XL": 24031, "5XL": 24164,
  },
  black: {
    S: 12126, M: 12125, L: 12124, XL: 12127,
    "2XL": 12128, "3XL": 12129, "4XL": 24039, "5XL": 24171,
  },
  navy: {
    S: 11988, M: 11987, L: 11986, XL: 11989,
    "2XL": 11990, "3XL": 11991, "4XL": 23993, "5XL": 24126,
  },
  "sport-grey": {
    S: 12072, M: 12071, L: 12070, XL: 12073,
    "2XL": 12074, "3XL": 12075, "4XL": 24021, "5XL": 24153,
  },
};

// ── Gildan 18500 Heavy Blend Hoodie ─────────────────────────────────
const HOODIE_PRODUCT_ID = "69d8c3476246f29b190f7d9e";

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
