import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-void">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-img2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover animate-about-hero-image"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 md:bg-gradient-to-r from-void via-void/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent" />
      </div>

      <Container className="relative z-10 flex min-h-[70vh] items-end py-16 lg:min-h-[85vh] lg:items-center lg:py-24">
        <div className="max-w-2xl animate-about-fade-up">
          <p className="font-heading text-3xl text-white md:text-5xl">
            MOTOR ELEMENT
          </p>
          <h1 className="mt-4 font-heading text-display italic leading-[0.95] md:text-hero">
            <span className="block text-white">JDM CULTURE.</span>
            <span className="block text-ignition">UNDERGROUND SOUL.</span>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-muted">
            Founded in 2018. Custom car apparel for people who actually drive —
            built by an enthusiast, for the street.
          </p>
          <div className="mt-10 grid w-full grid-cols-2 gap-4 md:flex md:w-auto">
            <Link href="/products" className="block min-w-0">
              <Button
                variant="primary"
                size="lg"
                className="w-full md:w-auto"
              >
                START MY BUILD
              </Button>
            </Link>
            <Link href="#origin" className="block min-w-0">
              <Button
                variant="secondary"
                size="lg"
                className="w-full md:w-auto"
              >
                OUR STORY
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
