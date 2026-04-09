import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/supabase/queries/products";
import ProductPage from "@/components/shop/ProductPage";
import ProductCustomizer from "@/components/shop/customizer/ProductCustomizer";
import { CustomizerProvider } from "@/components/shop/customizer/CustomizerContext";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { data: product } = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found — Motor Element" };

  return {
    title: `${product.name} — Motor Element`,
    description: `Customize your ${product.name} with AI-generated car artwork.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  if (params.slug === "custom") {
    return (
      <CustomizerProvider>
        <div className="min-h-[calc(100vh-8rem)] bg-void">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <ProductCustomizer />
          </div>
        </div>
      </CustomizerProvider>
    );
  }

  const { data: product } = await getProductBySlug(params.slug);
  if (!product) notFound();

  return (
    <CustomizerProvider>
      <div className="min-h-screen bg-void">
        <ProductPage
          product={product}
          printifyProductId={product.printifyBlueprintId}
        >
          <div className="mt-10 border-t border-border pt-8">
            <ProductCustomizer />
          </div>
        </ProductPage>
      </div>
    </CustomizerProvider>
  );
}
