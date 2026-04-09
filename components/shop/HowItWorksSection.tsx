import { SectionLabel } from "@/components/ui/SectionLabel";
import { StepCard } from "@/components/shop/StepCard";

const steps = [
  {
    number: "01",
    title: "UPLOAD",
    description:
      "Upload a photo of your car. Any angle, any condition — we work with what you've got.",
  },
  {
    number: "02",
    title: "AI RENDER",
    description:
      "Our AI transforms your photo into a stylised illustration ready for print.",
  },
  {
    number: "03",
    title: "WEAR",
    description:
      "Pick your product, place your order. Premium print-on-demand, shipped worldwide.",
    highlighted: true,
    ctaLabel: "START DESIGN",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-void py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>PROCESS ARCHITECTURE</SectionLabel>
            <h2 className="mt-2 font-heading text-display text-white">
              HOW IT WORKS
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted">
            Three steps from your garage to your wardrobe. No design skills
            required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
