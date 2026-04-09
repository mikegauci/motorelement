import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-obsidian py-12 md:py-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.02]">
        <span className="whitespace-nowrap font-heading leading-none text-white text-[17vw] select-none">
          MOTOR ELEMENT
        </span>
      </div>

      <Container size="narrow" className="relative z-10 text-center">
        <h2 className="font-heading text-display text-white lg:text-hero">
          READY TO REP YOUR RIDE?
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted">
          Upload a photo of your car, let our AI work its magic, and wear
          your build everywhere you go.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/product/custom">
            <Button variant="primary" size="lg">
              START MY BUILD
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary" size="lg">
              BROWSE SHOP
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
