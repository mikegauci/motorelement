import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-void">
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
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-end px-6 pb-24 pt-0 lg:items-center lg:pb-0">
        <div className="max-w-2xl"> 
          <h1 className="mt-6 font-heading text-hero italic leading-[0.95]">
            <span className="block text-white">YOUR CAR.</span>
            <span className="block text-ignition">YOUR ART.</span>
            <span className="block text-white">YOUR STYLE.</span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-muted">
            Premium custom car apparel designed by you, powered by AI, and
            delivered with brute force quality. JDM-inspired, built for the
            street.
          </p>

          <div className="mt-10 flex gap-4">
            <Link href="/product/custom">
              <Button variant="primary" size="lg">
                START MY BUILD
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg">
                LEARN MORE
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
