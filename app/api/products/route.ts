import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/supabase/queries/products";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { data, error } = await getActiveProducts();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ products: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, type, basePrice, printifyBlueprintId } = body;

  if (!name || !type || basePrice == null || !printifyBlueprintId) {
    return NextResponse.json(
      { error: "name, type, basePrice, and printifyBlueprintId are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      type,
      base_price: basePrice,
      printify_blueprint_id: printifyBlueprintId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
