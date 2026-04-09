import { createClient } from "@/lib/supabase/server";
import type { Product, ProductType } from "@/types/product";

interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

function toProduct(row: {
  id: string;
  name: string;
  type: string;
  base_price: number;
  printify_blueprint_id: string;
  active: boolean;
}): Product {
  return {
    id: row.id,
    name: row.name,
    type: row.type as ProductType,
    basePrice: row.base_price,
    printifyBlueprintId: row.printify_blueprint_id,
    active: row.active,
  };
}

export async function getActiveProducts(): Promise<QueryResult<Product[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.map(toProduct), error: null };
}

export async function getProductById(
  id: string
): Promise<QueryResult<Product>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: toProduct(data), error: null };
}
