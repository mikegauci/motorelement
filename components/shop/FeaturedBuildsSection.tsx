import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "./SectionWrapper";

const featuredProducts = [
  {
    id: "r35-gtr-boost-tee",
    name: "R35 GT-R Boost Tee",
    price: 35.0,
    label: "R35",
  },
  {
    id: "supra-mk4-hoodie",
    name: "Supra MK4 Hoodie",
    price: 35.0,
    label: "MK4",
  },
  {
    id: "mazda-rx7-tee",
    name: "Mazda RX-7 Tee",
    price: 35.0,
    label: "RX-7",
  },
  {
    id: "honda-nsr-case",
    name: "Honda NSR Case",
    price: 35.0,
    label: "NSR",
  },
];

export function FeaturedBuildsSection() {
  return (
    <SectionWrapper>
      <Container>
        <h2 className="mb-8 text-center font-heading text-display text-white md:mb-12">
          FEATURED ITEMS
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="flex flex-col p-0 overflow-hidden">
              <div className="relative aspect-square w-full bg-carbon flex items-center justify-center border-b border-border">
                <span className="font-heading text-[64px] text-white/10">
                  {product.label}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <h3 className="font-sub font-bold uppercase tracking-widest text-sm text-white">
                  {product.name}
                </h3>
                <span className="text-sm text-muted">
                  ${product.price.toFixed(2)}
                </span>
                <Link href="/products">
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    ADD TO CART
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
