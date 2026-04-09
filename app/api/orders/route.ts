import { NextResponse } from "next/server";

// TODO: CRUD operations for orders
export async function GET() {
  return NextResponse.json({ orders: [] });
}

export async function POST() {
  return NextResponse.json({ message: "TODO" });
}
