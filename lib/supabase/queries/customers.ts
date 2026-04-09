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

export async function getCustomerById(
  id: string
): Promise<QueryResult<Customer>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: toCustomer(data), error: null };
}

export async function upsertCustomer(customer: {
  id: string;
  email: string;
  name: string;
}): Promise<QueryResult<Customer>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .upsert(
      {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: toCustomer(data), error: null };
}
