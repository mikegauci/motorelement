import { NextResponse } from "next/server";

// TODO: handle illustration generation via fal.ai
export async function POST() {
  return NextResponse.json({ message: "TODO" });
}

export async function GET() {
  return NextResponse.json({ illustrations: [] });
}
