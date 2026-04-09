import Link from "next/link";

// TODO: fetch products from Supabase and render product grid
export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">SHOP ALL</h1>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/product/custom"
          className="group relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-8 transition hover:border-white/25 hover:bg-white/10"
        >
          <div className="mb-4 flex h-40 w-40 items-center justify-center rounded-full bg-white/10 text-5xl transition group-hover:bg-white/15">
            🎨
          </div>
          <h2 className="font-heading text-2xl text-white">Custom Design</h2>
          <p className="mt-2 text-center text-sm text-white/60">
            Upload your car photo, generate vector artwork, and build a
            print-ready design.
          </p>
        </Link>
      </div>

      {/* TODO: product grid from Supabase */}
    </div>
  );
}
