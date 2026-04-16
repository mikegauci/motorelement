import { printifyFetch, shopPath } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PrintifyAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

interface PrintifyLineItem {
  product_id?: string;
  blueprint_id?: number;
  print_provider_id?: number;
  variant_id: number;
  quantity: number;
  print_areas?: Record<string, string>;
}

interface PrintifyOrder {
  id: string;
  status: string;
  address_to: PrintifyAddress;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
  }>;
  total_price: number;
  total_shipping: number;
  created_at: string;
  shipments: Array<{
    carrier: string;
    number: string;
    url: string;
    delivered_at: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createPrintifyOrder({
  externalId,
  lineItems,
  address,
  sendShippingNotification = false,
  shippingMethod = 1,
}: {
  externalId: string;
  lineItems: PrintifyLineItem[];
  address: PrintifyAddress;
  sendShippingNotification?: boolean;
  shippingMethod?: number;
}): Promise<PrintifyOrder> {
  return printifyFetch<PrintifyOrder>(shopPath("/orders.json"), {
    method: "POST",
    body: JSON.stringify({
      external_id: externalId,
      line_items: lineItems,
      shipping_method: shippingMethod,
      send_shipping_notification: sendShippingNotification,
      address_to: address,
    }),
  });
}

// ---------------------------------------------------------------------------
// Products (read-only helpers for admin/debugging)
// ---------------------------------------------------------------------------

export async function getProduct(productId: string) {
  return printifyFetch(shopPath(`/products/${productId}.json`)  );
}

async function getProductThumbnail(
  productId: string
): Promise<string | null> {
  try {
    const product = await printifyFetch<{
      images: Array<{ src: string; position: string; is_default: boolean }>;
    }>(shopPath(`/products/${productId}.json`));

    const frontDefault = product.images.find(
      (img) => img.position === "front" && img.is_default
    );
    return frontDefault?.src ?? product.images[0]?.src ?? null;
  } catch {
    return null;
  }
}
