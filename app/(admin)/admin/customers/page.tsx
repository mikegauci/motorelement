import { getAllCustomers } from "@/lib/supabase/queries/customers";

export default async function AdminCustomersPage() {
  const { data: customers, error } = await getAllCustomers();

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">CUSTOMERS</h1>

      {error && (
        <p className="mt-4 font-body text-sm text-redline">{error}</p>
      )}

      {customers && customers.length === 0 && (
        <p className="mt-8 text-sm text-muted">No customers yet.</p>
      )}

      {customers && customers.length > 0 && (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Name
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Email
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border/50">
                  <td className="py-4 font-body text-sm text-white">
                    {customer.name}
                  </td>
                  <td className="py-4 font-mono text-sm text-muted">
                    {customer.email}
                  </td>
                  <td className="py-4 font-body text-sm text-muted">
                    {new Date(customer.createdAt).toLocaleDateString()}
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
