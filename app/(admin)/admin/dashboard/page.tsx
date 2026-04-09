import Link from "next/link";
import { getDashboardMetrics } from "@/lib/supabase/queries/metrics";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function MetricCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="border border-border bg-obsidian p-6">
      <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-4xl text-white">{value}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}

export default async function AdminDashboardPage() {
  const { data: metrics, error } = await getDashboardMetrics();

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">DASHBOARD</h1>

      {error && (
        <p className="mt-4 font-body text-sm text-redline">{error}</p>
      )}

      {metrics && (
        <>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Revenue"
              value={formatPrice(metrics.totalRevenue)}
            />
            <MetricCard
              label="Orders"
              value={String(metrics.totalOrders)}
              href="/admin/orders"
            />
            <MetricCard
              label="Customers"
              value={String(metrics.totalCustomers)}
              href="/admin/customers"
            />
            <MetricCard
              label="Active Products"
              value={String(metrics.totalProducts)}
              href="/admin/products"
            />
          </div>

          <div className="mt-12">
            <h2 className="font-heading text-2xl text-white">RECENT ORDERS</h2>

            {metrics.recentOrders.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No orders yet.</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                        Order ID
                      </th>
                      <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                        Total
                      </th>
                      <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                        Status
                      </th>
                      <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50">
                        <td className="py-4 font-mono text-sm text-white">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="py-4 font-mono text-sm text-white">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-4">
                          <span className="inline-block rounded-none bg-carbon px-2 py-1 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 font-body text-sm text-muted">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
