import { NextResponse } from "next/server";
import {
  getOrdersByCustomer,
  createOrder,
} from "@/lib/supabase/queries/orders";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json(
      { error: "customerId query parameter is required" },
      { status: 400 }
    );
  }

  const { data, error } = await getOrdersByCustomer(customerId);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customerId, total, items } = body;

  if (!customerId || total == null || !items?.length) {
    return NextResponse.json(
      { error: "customerId, total, and items are required" },
      { status: 400 }
    );
  }

  const { data, error } = await createOrder({ customerId, total, items });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ order: data }, { status: 201 });
}
