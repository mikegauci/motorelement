// TODO: fetch single product by ID, render PDP
export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">
        PRODUCT {params.id}
      </h1>
      {/* TODO: product detail layout */}
    </div>
  );
}
