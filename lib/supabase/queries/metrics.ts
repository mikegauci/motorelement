import { createClient } from "@/lib/supabase/server";

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalIllustrations: number;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export async function getDashboardMetrics(): Promise<{
  data: DashboardMetrics | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const [ordersRes, customersRes, productsRes, illustrationsRes] =
    await Promise.all([
      supabase.from("orders").select("id, total, status, created_at"),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("illustrations")
        .select("id", { count: "exact", head: true }),
    ]);

  if (ordersRes.error) {
    return { data: null, error: ordersRes.error.message };
  }

  const orders = ordersRes.data ?? [];
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const recentOrders = orders
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      createdAt: o.created_at,
    }));

  return {
    data: {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: customersRes.count ?? 0,
      totalProducts: productsRes.count ?? 0,
      totalIllustrations: illustrationsRes.count ?? 0,
      recentOrders,
    },
    error: null,
  };
}
