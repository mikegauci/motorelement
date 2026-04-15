import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types/customer";

interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

function toCustomer(row: {
  id: string;
  email: string;
  name: string;
  created_at: string;
}): Customer {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function getAllCustomers(): Promise<QueryResult<Customer[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.map(toCustomer), error: null };
}
