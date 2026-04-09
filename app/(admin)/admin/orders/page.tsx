import { getAllOrders } from "@/lib/supabase/queries/orders";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/30 text-yellow-400",
  paid: "bg-green-900/30 text-green-400",
  fulfilled: "bg-blue-900/30 text-blue-400",
  shipped: "bg-purple-900/30 text-purple-400",
  cancelled: "bg-red-900/30 text-red-400",
};

export default async function AdminOrdersPage() {
  const { data: orders, error } = await getAllOrders();

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">ORDERS</h1>

      {error && (
        <p className="mt-4 font-body text-sm text-redline">{error}</p>
      )}

      {orders && orders.length === 0 && (
        <p className="mt-8 text-sm text-muted">No orders yet.</p>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Order ID
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Customer
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Items
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
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="py-4 font-mono text-sm text-white">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-4 font-mono text-sm text-muted">
                    {order.customerId.slice(0, 8)}...
                  </td>
                  <td className="py-4 font-mono text-sm text-white">
                    {order.items?.length ?? 0}
                  </td>
                  <td className="py-4 font-mono text-sm text-white">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-block rounded-none px-2 py-1 font-sub text-xs font-bold uppercase tracking-widest ${STATUS_COLORS[order.status] ?? "bg-carbon text-muted"}`}
                    >
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
  );
}
