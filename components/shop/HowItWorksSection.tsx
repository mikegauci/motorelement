import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StepCard } from "@/components/shop/StepCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const steps = [
  {
    number: "01",
    title: "UPLOAD",
    description:
      "Simply upload a high quality photo of your ride. Our system handles any vehicle and angle.",
    ctaHref: "/products",
  },
  {
    number: "02",
    title: "CUSTOMIZE",
    description:
      "Watch our advanced AI generate multiple design options and styles instantly. Customize and refine your design.",
    ctaHref: "/products",
  },
  {
    number: "03",
    title: "WEAR",
    description:
      "Get your custom apparel shipped directly to your door! Represent your build, everywhere.",
    ctaHref: "/products",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-void py-12 md:py-24 lg:mt-[-100px]">
      <Container>
        <div className="mb-8 text-center md:mb-12">
          <SectionLabel>PROCESS ARCHITECTURE</SectionLabel>
          <h2 className="mt-2 font-heading text-display text-white">
            HOW IT WORKS
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/product/classic-tee"
            className="block w-full md:w-auto"
          >
            <Button variant="primary" size="lg" className="w-full md:w-auto">
              TRY IT NOW
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
