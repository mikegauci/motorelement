import { createClient } from "@/lib/supabase/server";
import type { QueryResult } from "./types";

interface Illustration {
  id: string;
  customerId: string;
  orderId: string | null;
  carMake: string;
  carModel: string;
  carYear: number;
  originalImageUrl: string;
  generatedImageUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

function toIllustration(row: {
  id: string;
  customer_id: string;
  order_id: string | null;
  car_make: string;
  car_model: string;
  car_year: number;
  original_image_url: string;
  generated_image_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}): Illustration {
  return {
    id: row.id,
    customerId: row.customer_id,
    orderId: row.order_id,
    carMake: row.car_make,
    carModel: row.car_model,
    carYear: row.car_year,
    originalImageUrl: row.original_image_url,
    generatedImageUrl: row.generated_image_url,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function getAllIllustrations(): Promise<
  QueryResult<Illustration[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("illustrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.map(toIllustration), error: null };
}
