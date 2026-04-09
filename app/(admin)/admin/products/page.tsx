import { getAllProducts } from "@/lib/supabase/queries/products";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminProductsPage() {
  const { data: products, error } = await getAllProducts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">PRODUCTS</h1>

      {error && (
        <p className="mt-4 font-body text-sm text-redline">{error}</p>
      )}

      {products && products.length === 0 && (
        <p className="mt-8 text-sm text-muted">No products yet.</p>
      )}

      {products && products.length > 0 && (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Name
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Type
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Base Price
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Blueprint ID
                </th>
                <th className="pb-3 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50">
                  <td className="py-4 font-body text-sm text-white">
                    {product.name}
                  </td>
                  <td className="py-4 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                    {product.type}
                  </td>
                  <td className="py-4 font-mono text-sm text-white">
                    {formatPrice(product.basePrice)}
                  </td>
                  <td className="py-4 font-mono text-sm text-muted">
                    {product.printifyBlueprintId}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-block rounded-none px-2 py-1 font-sub text-xs font-bold uppercase tracking-widest ${product.active ? "bg-green-900/30 text-green-400" : "bg-carbon text-muted"}`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
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
