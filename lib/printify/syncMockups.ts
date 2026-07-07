import zlib from "zlib";
import { printifyFetch, shopPath } from "./client";
import { uploadPrintifyImageByBase64, uploadPrintifyImageByUrl } from "./uploads";

const POLL_INTERVAL_MS = 2000;
const MOCKUP_SETTLE_MS = 2000;
const MOCKUP_POLL_WINDOW_MS = 60000;
const TRANSPARENT_PNG_SIZE = 2000;
const FLAT_MOCKUP_POSITIONS = new Set(["front", "back"]);

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function createTransparentPngBase64(size: number): string {
  const rowLength = size * 4;
  const raw = Buffer.alloc(size * (rowLength + 1));
  const idat = zlib.deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const png = Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  return png.toString("base64");
}

let cachedTransparentPng: string | null = null;
function transparentPngBase64(): string {
  if (!cachedTransparentPng) {
    cachedTransparentPng = createTransparentPngBase64(TRANSPARENT_PNG_SIZE);
  }
  return cachedTransparentPng;
}

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

function sideFromPosition(position: string | undefined): "front" | "back" | null {
  if (!position) return null;
  if (position === "front" || position.startsWith("front_") || position.startsWith("front-")) {
    return "front";
  }
  if (position === "back" || position.startsWith("back_") || position.startsWith("back-")) {
    return "back";
  }
  return null;
}

function assignFreshPlaceholderImages(
  printAreas: PrintArea[],
  variantId: number,
  uploadIds: Partial<Record<"front" | "back", string>>,
  transparentUploadId: string,
): void {
  for (const area of printAreas) {
    const variantAppliesHere = Boolean(area.variant_ids?.includes(variantId));
    for (const ph of area.placeholders ?? []) {
      const side = sideFromPosition(ph.position);
      const uploadId =
        (variantAppliesHere && side && uploadIds[side]) || transparentUploadId;
      ph.images = [{ id: uploadId, x: 0.5, y: 0.5, scale: 1, angle: 0 }];
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
    if (!FLAT_MOCKUP_POSITIONS.has(img.position ?? "")) continue;
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

  const transparent = await uploadPrintifyImageByBase64({
    file_name: `preview-empty-${Date.now()}.png`,
    contents: transparentPngBase64(),
  });

  await new Promise((r) => setTimeout(r, 1500));

  const productPath = `/products/${mockProductId}.json`;
  const fresh = (await printifyFetch<ProductPayload>(shopPath(productPath), {
    cache: "no-store",
  })) as ProductPayload;

  const printAreas = JSON.parse(JSON.stringify(fresh.print_areas ?? [])) as PrintArea[];
  if (!printAreas.length) {
    throw new Error("Mock product has no print_areas");
  }

  const previousSrcs = new Set(extractMockups(fresh, variantId).map((m) => m.src));

  assignFreshPlaceholderImages(printAreas, variantId, uploadIds, transparent.id);

  await printifyFetch<ProductPayload>(shopPath(productPath), {
    method: "PUT",
    body: JSON.stringify({ print_areas: printAreas }),
  });

  await new Promise((r) => setTimeout(r, MOCKUP_SETTLE_MS));

  let mockups: MockupGalleryImage[] = [];
  const deadline = Date.now() + MOCKUP_POLL_WINDOW_MS;
  while (true) {
    const refreshed = (await printifyFetch<ProductPayload>(shopPath(productPath), {
      cache: "no-store",
    })) as ProductPayload;
    mockups = extractMockups(refreshed, variantId);
    const allFresh =
      mockups.length > 0 && mockups.every((m) => !previousSrcs.has(m.src));
    if (allFresh) break;
    if (Date.now() >= deadline) {
      if (!allFresh) {
        throw new Error(
          "Printify mockup refresh timed out before new images were ready",
        );
      }
      break;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  return { mockups };
}
