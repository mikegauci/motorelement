export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "shipped"
  | "cancelled";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  size: string;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  stripePaymentId: string;
  printifyOrderId: string;
  total: number;
  createdAt: string;
  items?: OrderItem[];
}
