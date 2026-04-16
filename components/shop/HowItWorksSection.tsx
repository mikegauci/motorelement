import Link from "next/link";
import { StepCard } from "@/components/shop/StepCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "./SectionWrapper";
import { SectionHeading } from "./SectionHeading";

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
    <SectionWrapper id="how-it-works" className="lg:mt-[-100px]">
      <Container>
        <SectionHeading eyebrow="PROCESS ARCHITECTURE" title="HOW IT WORKS" />

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
    </SectionWrapper>
  );
}
