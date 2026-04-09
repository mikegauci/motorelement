import { printifyFetch, shopPath } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyImage {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}

export interface PrintifyAddress {
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

export interface PrintifyLineItem {
  product_id: string;
  variant_id: number;
  quantity: number;
  print_areas?: Record<string, string>;
}

export interface PrintifyOrder {
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
// Shops
// ---------------------------------------------------------------------------

export async function getShops(): Promise<PrintifyShop[]> {
  return printifyFetch<PrintifyShop[]>("/shops.json");
}

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

export async function uploadImage(
  imageUrl: string,
  fileName = "artwork.png"
): Promise<PrintifyImage> {
  return printifyFetch<PrintifyImage>("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({
      file_name: fileName,
      url: imageUrl,
    }),
  });
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

export async function getOrder(orderId: string): Promise<PrintifyOrder> {
  return printifyFetch<PrintifyOrder>(
    shopPath(`/orders/${orderId}.json`)
  );
}

export async function listOrders(): Promise<{
  current_page: number;
  data: PrintifyOrder[];
}> {
  return printifyFetch(shopPath("/orders.json"));
}

// ---------------------------------------------------------------------------
// Products (read-only helpers for admin/debugging)
// ---------------------------------------------------------------------------

export async function getProduct(productId: string) {
  return printifyFetch(shopPath(`/products/${productId}.json`));
}

export async function listProducts() {
  return printifyFetch<{ current_page: number; data: unknown[] }>(
    shopPath("/products.json")
  );
}

// ---------------------------------------------------------------------------
// Shipping cost
// ---------------------------------------------------------------------------

export async function calculateShipping({
  lineItems,
  address,
}: {
  lineItems: PrintifyLineItem[];
  address: Pick<PrintifyAddress, "country" | "region" | "city" | "zip">;
}) {
  return printifyFetch<{ standard: number; express: number }>(
    shopPath("/orders/shipping_cost.json"),
    {
      method: "POST",
      body: JSON.stringify({
        line_items: lineItems,
        address_to: address,
      }),
    }
  );
}
