import { getProduct } from "./helpers";

interface ShopVariant {
  id: number;
  is_enabled: boolean;
  is_available: boolean;
  options: number[];
}

interface ShopProductPayload {
  variants: ShopVariant[];
}

function sortedOpts(options: number[]): number[] {
  return [...options].sort((a, b) => a - b);
}

function sameOptions(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export async function resolveMockProductVariantId(opts: {
  listingProductId: string;
  listingVariantId: number;
  mockProductId: string;
}): Promise<number> {
  const { listingProductId, listingVariantId, mockProductId } = opts;

  if (listingProductId === mockProductId) {
    const product = (await getProduct(listingProductId)) as ShopProductPayload;
    const variant = product.variants?.find(
      (v) =>
        v.id === listingVariantId && v.is_enabled && v.is_available,
    );
    if (!variant) {
      throw new Error(
        `Variant ${listingVariantId} not found on product ${listingProductId}`,
      );
    }
    return listingVariantId;
  }

  const [listingRaw, mockRaw] = await Promise.all([
    getProduct(listingProductId),
    getProduct(mockProductId),
  ]);

  const listing = listingRaw as ShopProductPayload;
  const mock = mockRaw as ShopProductPayload;

  const source = listing.variants?.find((v) => v.id === listingVariantId);
  if (!source) {
    throw new Error(`Variant ${listingVariantId} not found on listing product`);
  }

  const targetSignature = sortedOpts(source.options ?? []);

  const match = mock.variants?.find(
    (v) =>
      v.is_enabled &&
      v.is_available &&
      sameOptions(sortedOpts(v.options ?? []), targetSignature),
  );

  if (!match) {
    throw new Error(
      "PRINTIFY_MOCKUP_PRODUCT_ID product has no enabled variant with the same option IDs as the PDP selection. Publish a duplicate tee from the Printify catalog so Colors/Sizes match your live product.",
    );
  }

  return match.id;
}
