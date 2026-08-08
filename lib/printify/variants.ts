/**
 * Maps Printify product IDs to their color+size → variant-ID tables.
 * Each product has its own map; the resolver picks the right one at runtime.
 */

type VariantMap = Record<string, Record<string, number>>;

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

const MUG_PRODUCT_ID = "6a76ffbd53b99ebb73054a0e";
const MUG_BLACK_PRODUCT_ID = "6a770b5ff9e2ca7b670f0f9d";

const MUG_VARIANTS: VariantMap = {
  white: {
    "11oz": 65216,
    "15oz": 104692,
  },
};

const MUG_BLACK_VARIANTS: VariantMap = {
  black: {
    "11oz": 65217,
    "15oz": 104470,
  },
};

const MUG_COLOR_PRODUCT_IDS: Record<string, string> = {
  white: MUG_PRODUCT_ID,
  black: MUG_BLACK_PRODUCT_ID,
};

const PRODUCT_VARIANTS: Record<string, { map: VariantMap; defaultColor: string }> = {
  [TEE_PRODUCT_ID]: { map: TEE_VARIANTS, defaultColor: "black" },
  [HOODIE_PRODUCT_ID]: { map: HOODIE_VARIANTS, defaultColor: "black" },
  [MUG_PRODUCT_ID]: { map: MUG_VARIANTS, defaultColor: "white" },
  [MUG_BLACK_PRODUCT_ID]: { map: MUG_BLACK_VARIANTS, defaultColor: "black" },
};

function normalizeColor(color: string | undefined, fallback: string): string {
  const normalized = color?.toLowerCase().replace(/\s+/g, "-").trim();
  return normalized || fallback;
}

function normalizeSize(size: string): string {
  const trimmed = size.trim();
  const lower = trimmed.toLowerCase();
  if (/^\d+(\.\d+)?oz$/.test(lower)) return lower;
  return trimmed.toUpperCase();
}

function lookupSize(colorMap: Record<string, number>, size: string): number | null {
  if (colorMap[size] != null) return colorMap[size];
  const lower = size.toLowerCase();
  for (const [key, id] of Object.entries(colorMap)) {
    if (key.toLowerCase() === lower) return id;
  }
  return null;
}

export function getLinkedPrintifyProductIds(primaryProductId: string): string[] {
  if (primaryProductId === MUG_PRODUCT_ID) {
    return [MUG_PRODUCT_ID, MUG_BLACK_PRODUCT_ID];
  }
  return [primaryProductId];
}

export function resolvePrintifyProductId(
  primaryProductId: string,
  color?: string
): string {
  if (primaryProductId !== MUG_PRODUCT_ID) return primaryProductId;
  const normalized = normalizeColor(color, "white");
  return MUG_COLOR_PRODUCT_IDS[normalized] ?? MUG_PRODUCT_ID;
}

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

  const normalizedColor = normalizeColor(color, entry.defaultColor);
  const normalizedSize = normalizeSize(size);

  const colorMap = entry.map[normalizedColor] ?? entry.map[entry.defaultColor];
  if (!colorMap) return null;
  return lookupSize(colorMap, normalizedSize);
}
