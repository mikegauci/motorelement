import type { Metadata } from "next";
import ProductCustomizer from "@/components/shop/ProductCustomizer";

export const metadata: Metadata = {
  title: "Customize your design — Motor Element",
  description:
    "Upload your car, generate vector artwork, and build a print-ready circular composite.",
};

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div
      className="bg-[#f7f7f5] min-h-[calc(100vh-8rem)] text-neutral-900"
      data-product-id={params.id}
    >
      <ProductCustomizer />
    </div>
  );
}
