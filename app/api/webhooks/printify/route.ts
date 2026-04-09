import { NextResponse } from "next/server";
import {
  getOrderByPrintifyId,
  updateOrderStatus,
} from "@/lib/supabase/queries/orders";
import type { OrderStatus } from "@/types/order";

interface PrintifyWebhookPayload {
  id: string;
  type: string;
  data: {
    shop_id?: number;
    status?: string;
    shipped_at?: string;
    carrier?: {
      code: string;
      tracking_number: string;
    };
  };
}

const STATUS_MAP: Record<string, OrderStatus> = {
  "in-production": "fulfilled",
  "shipping": "shipped",
  "delivered": "shipped",
  "canceled": "cancelled",
};

export async function POST(request: Request) {
  let payload: PrintifyWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id: printifyOrderId, type: eventType, data } = payload;
  console.log(`[printify-webhook] ${eventType} for order ${printifyOrderId}`);

  switch (eventType) {
    case "order:updated": {
      if (data.status) {
        const mappedStatus = STATUS_MAP[data.status];
        if (mappedStatus) {
          const { data: order } =
            await getOrderByPrintifyId(printifyOrderId);
          if (order) {
            await updateOrderStatus(order.id, mappedStatus);
            console.log(
              `[printify-webhook] Updated order ${order.id} to ${mappedStatus}`
            );
          }
        }
      }
      break;
    }

    case "order:sent-to-production": {
      const { data: order } = await getOrderByPrintifyId(printifyOrderId);
      if (order) {
        await updateOrderStatus(order.id, "fulfilled");
        console.log(
          `[printify-webhook] Order ${order.id} sent to production`
        );
      }
      break;
    }

    case "order:shipment:created": {
      const { data: order } = await getOrderByPrintifyId(printifyOrderId);
      if (order) {
        await updateOrderStatus(order.id, "shipped");
        console.log(
          `[printify-webhook] Order ${order.id} shipped via ${data.carrier?.code ?? "unknown"}, tracking: ${data.carrier?.tracking_number ?? "none"}`
        );
      }
      break;
    }

    case "order:shipment:delivered": {
      const { data: order } = await getOrderByPrintifyId(printifyOrderId);
      if (order) {
        await updateOrderStatus(order.id, "shipped");
        console.log(
          `[printify-webhook] Order ${order.id} delivered`
        );
      }
      break;
    }

    default:
      console.log(`[printify-webhook] Unhandled event: ${eventType}`);
  }

  return NextResponse.json({ received: true });
}
