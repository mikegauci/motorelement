import { printifyFetch, shopPath } from "./client";
import { uploadPrintifyImageByUrl } from "./uploads";

const POLL_INTERVAL_MS = 750;
const POLL_TIMEOUT_MS = 6000;

export interface MockupGalleryImage {
  src: string;
  position: string;
  is_default?: boolean;
}

interface PlaceholderImg {
  id?: string;
  src?: string;
  name?: string;
  type?: string;
  height?: number;
  width?: number;
  x?: number;
  y?: number;
  scale?: number;
  angle?: number;
}

interface PrintArea {
  variant_ids?: number[];
  placeholders?: Array<{
    position: string;
    decoration_method?: string;
    images?: PlaceholderImg[];
  }>;
}

interface ProductImage {
  src: string;
  variant_ids?: number[];
  position?: string;
  is_default?: boolean;
}

interface ProductPayload {
  print_areas?: PrintArea[];
  images?: ProductImage[];
}

function assignFreshPlaceholderImages(
  printAreas: PrintArea[],
  variantId: number,
  uploadIds: Partial<Record<"front" | "back", string>>,
): void {
  for (const area of printAreas) {
    const variantAppliesHere = Boolean(area.variant_ids?.includes(variantId));
    for (const ph of area.placeholders ?? []) {
      const pos = ph.position === "front" || ph.position === "back" ? ph.position : null;
      const uploadId = variantAppliesHere && pos ? uploadIds[pos] : undefined;
      ph.images = uploadId
        ? [{ id: uploadId, x: 0.5, y: 0.5, scale: 1, angle: 0 }]
        : [];
    }
  }
}

function sortMockupsForVariant(list: MockupGalleryImage[]): MockupGalleryImage[] {
  return [...list].sort((a, b) => {
    const ad = a.is_default ? 1 : 0;
    const bd = b.is_default ? 1 : 0;
    return bd - ad;
  });
}

function extractMockups(product: ProductPayload, variantId: number): MockupGalleryImage[] {
  const imgs = product.images ?? [];
  const out: MockupGalleryImage[] = [];
  const seen = new Set<string>();
  for (const img of imgs) {
    if (!img.variant_ids?.includes(variantId) || !img.src) continue;
    if (seen.has(img.src)) continue;
    seen.add(img.src);
    out.push({
      src: img.src,
      position: img.position ?? "other",
      is_default: img.is_default,
    });
  }
  return sortMockupsForVariant(out);
}

export async function renderMockProductPreview(opts: {
  mockProductId: string;
  variantId: number;
  printFileUrls: Partial<Record<"front" | "back", string>>;
}): Promise<{ mockups: MockupGalleryImage[] }> {
  const { mockProductId, variantId, printFileUrls } = opts;

  const uploadIds: Partial<Record<"front" | "back", string>> = {};

  if (printFileUrls.front) {
    const up = await uploadPrintifyImageByUrl({
      file_name: `preview-front-${variantId}-${Date.now()}.png`,
      url: printFileUrls.front,
    });
    uploadIds.front = up.id;
  }

  if (printFileUrls.back) {
    const up = await uploadPrintifyImageByUrl({
      file_name: `preview-back-${variantId}-${Date.now()}.png`,
      url: printFileUrls.back,
    });
    uploadIds.back = up.id;
  }

  const productPath = `/products/${mockProductId}.json`;
  const fresh = (await printifyFetch<ProductPayload>(shopPath(productPath))) as ProductPayload;

  const printAreas = JSON.parse(JSON.stringify(fresh.print_areas ?? [])) as PrintArea[];
  if (!printAreas.length) {
    throw new Error("Mock product has no print_areas");
  }

  assignFreshPlaceholderImages(printAreas, variantId, uploadIds);

  const updated = (await printifyFetch<ProductPayload>(shopPath(productPath), {
    method: "PUT",
    body: JSON.stringify({ print_areas: printAreas }),
  })) as ProductPayload;

  let mockups = extractMockups(updated, variantId);
  if (mockups.length > 0) return { mockups };

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const refreshed = (await printifyFetch<ProductPayload>(shopPath(productPath))) as ProductPayload;
    mockups = extractMockups(refreshed, variantId);
    if (mockups.length > 0) return { mockups };
  }

  return { mockups: [] };
}
