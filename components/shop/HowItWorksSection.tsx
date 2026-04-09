import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StepCard } from "@/components/shop/StepCard";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    number: "01",
    title: "UPLOAD",
    description:
      "Simply upload a high quality photo of your ride. Our system handles any vehicle and angle.",
    ctaHref: "/product/custom",
  },
  {
    number: "02",
    title: "AI RENDER",
    description:
      "Watch our advanced AI generate multiple design options and styles instantly. Customize and refine your design.",
    ctaHref: "/products",
  },
  {
    number: "03",
    title: "WEAR",
    description:
      "Get your custom apparel shipped directly to your door! Represent your build, everywhere.",
    ctaHref: "/product/custom",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-void py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
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
          <Link href="/product/classic-tee">
            <Button variant="primary" size="lg">
              TRY IT NOW
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
