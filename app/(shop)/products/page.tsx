import Image from "next/image";
import Link from "next/link";
import { getActiveProducts } from "@/lib/supabase/queries/products";
import type { Product, ProductType } from "@/types/product";

const TYPE_LABELS: Record<ProductType, string> = {
  "t-shirt": "T-Shirt",
  hoodie: "Hoodie",
  poster: "Poster",
  canvas: "Canvas",
  mug: "Mug",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function ProductsPage() {
  const { data: products } = await getActiveProducts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">SHOP ALL</h1>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((product: Product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group relative flex flex-col items-center border border-white/10 bg-white/5 p-8 transition hover:border-white/25 hover:bg-white/10"
          >
            {product.thumbnailUrl ? (
              <div className="relative mb-4 h-48 w-48 overflow-hidden">
                <Image
                  src={product.thumbnailUrl}
                  alt={product.name}
                  fill
                  className="object-contain transition group-hover:scale-105"
                  sizes="192px"
                />
              </div>
            ) : (
              <div className="mb-4 flex h-48 w-48 items-center justify-center bg-white/5">
                <span className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  {TYPE_LABELS[product.type] ?? product.type}
                </span>
              </div>
            )}
            <h2 className="font-heading text-2xl text-white">
              {product.name}
            </h2>
            <p className="mt-2 text-center text-sm text-white/60">
              {TYPE_LABELS[product.type] ?? product.type} &middot;{" "}
              {formatPrice(product.basePrice)}
            </p>
          </Link>
        ))}
      </div>

      {!products?.length && (
        <p className="mt-8 text-center text-sm text-muted">
          No products available yet. Check back soon.
        </p>
      )}
    </div>
  );
}
