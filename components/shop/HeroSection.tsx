import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-void">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-img2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 md:bg-gradient-to-r from-void via-void/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent" />
      </div>

      <Container className="relative z-10 flex lg:min-h-screen items-end lg:items-center">
        <div className="max-w-2xl"> 
          <h1 className="mt-6 font-heading text-display italic leading-[0.95] md:text-hero">
            <span className="block text-white">YOUR CAR.</span>
            <span className="block text-ignition">YOUR ART.</span>
            <span className="block text-white">YOUR STYLE.</span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-muted">
            Premium custom car apparel designed by you, powered by AI, and
            delivered with brute force quality. JDM-inspired, built for the
            street.
          </p>

          <div className="mt-10 grid w-full grid-cols-2 gap-4 md:flex md:w-auto">
            <Link href="/product/custom" className="block min-w-0">
              <Button
                variant="primary"
                size="lg"
                className="w-full md:w-auto"
              >
                START MY BUILD
              </Button>
            </Link>
            <Link href="#how-it-works" className="block min-w-0">
              <Button
                variant="secondary"
                size="lg"
                className="w-full md:w-auto"
              >
                LEARN MORE
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
