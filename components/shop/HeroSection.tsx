import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-void">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_#1A1A1A_0%,_#0A0A0A_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/90 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-end px-6 pb-24 pt-32 lg:items-center lg:pb-0">
        <div className="max-w-2xl">
          <Badge>LIMITED RELEASE 006</Badge>

          <h1 className="mt-6 font-heading text-hero italic leading-[0.95]">
            <span className="block text-white">YOUR CAR.</span>
            <span className="block text-ignition">YOUR ART.</span>
            <span className="block text-white">YOUR STYLE.</span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-muted">
            Precision-engineered apparel for the modern driver. Upload your
            build, generate high-end AI visuals, and wear your passion on the
            street.
          </p>

          <div className="mt-10 flex gap-4">
            <Link href="/product/custom">
              <Button variant="primary" size="lg">
                START MY BUILD
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="secondary" size="lg">
                EXPLORE THE COLLECTION
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
