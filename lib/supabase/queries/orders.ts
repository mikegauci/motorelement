import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderStatus } from "@/types/order";

interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

function toOrder(row: {
  id: string;
  customer_id: string;
  status: string;
  stripe_payment_id: string | null;
  printify_order_id: string | null;
  total: number;
  created_at: string;
  order_items?: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    size: string;
    price: number;
  }>;
}): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    status: row.status as OrderStatus,
    stripePaymentId: row.stripe_payment_id ?? "",
    printifyOrderId: row.printify_order_id ?? "",
    total: row.total,
    createdAt: row.created_at,
    items: row.order_items?.map(toOrderItem),
  };
}

function toOrderItem(row: {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  size: string;
  price: number;
}): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    quantity: row.quantity,
    size: row.size,
    price: row.price,
  };
}

export async function getAllOrders(): Promise<QueryResult<Order[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.map(toOrder), error: null };
}

export async function getOrdersByCustomer(
  customerId: string
): Promise<QueryResult<Order[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.map(toOrder), error: null };
}

export async function getOrderById(
  id: string
): Promise<QueryResult<Order>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: toOrder(data), error: null };
}

export async function createOrder(order: {
  customerId: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    size: string;
    price: number;
  }>;
}): Promise<QueryResult<Order>> {
  const supabase = await createClient();

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: order.customerId,
      total: order.total,
    })
    .select()
    .single();

  if (orderError) {
    return { data: null, error: orderError.message };
  }

  const itemInserts = order.items.map((item) => ({
    order_id: orderRow.id,
    product_id: item.productId,
    quantity: item.quantity,
    size: item.size,
    price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemInserts);

  if (itemsError) {
    return { data: null, error: itemsError.message };
  }

  return { data: toOrder(orderRow), error: null };
}
