import { NextResponse } from "next/server";

// TODO: CRUD operations for products
export async function GET() {
  return NextResponse.json({ products: [] });
}

export async function POST() {
  return NextResponse.json({ message: "TODO" });
}
