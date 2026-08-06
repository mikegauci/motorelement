import Image from "next/image";
import { Sparkles, PenTool } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/shop/SectionWrapper";
import { SectionHeading } from "@/components/shop/SectionHeading";

const paths = [
  {
    icon: Sparkles,
    title: "AI GENERATION",
    description:
      "Upload a photo of your ride and get artistic renders in seconds. Refine backgrounds, colors, and layout until it feels right — then lock it in for print.",
  },
  {
    icon: PenTool,
    title: "IN-HOUSE DESIGNERS",
    description:
      "Want a hand-finished look? Our in-house designers take your brief and craft a custom illustration of your car — built with the same street-level taste as the brand.",
  },
];

export function AboutCraft() {
  return (
    <SectionWrapper bg="obsidian">
      <Container>
        <SectionHeading
          eyebrow="THE CRAFT"
          title="AI SPEED. HUMAN HAND."
          subtitle="Two ways to get art that actually looks like your car — generate instantly, or work with our designers."
        />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          {paths.map((path) => (
            <div
              key={path.title}
              className="group flex flex-col gap-4 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center border border-border bg-carbon text-ignition transition-colors duration-300 group-hover:border-ignition group-hover:text-white">
                <path.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-3xl text-white md:text-4xl">
                {path.title}
              </h3>
              <p className="max-w-md text-base leading-relaxed text-muted">
                {path.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden bg-carbon">
            <Image
              src="/images/gallery/builds/supra-before-1.jpg"
              alt="Car photo before custom artwork"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <span className="absolute bottom-4 left-4 font-mono text-xs uppercase tracking-widest text-white/80">
              Your photo
            </span>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-carbon">
            <Image
              src="/images/gallery/builds/supra-after.jpg"
              alt="Custom generated car artwork"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <span className="absolute bottom-4 left-4 font-mono text-xs uppercase tracking-widest text-white/80">
              Your art
            </span>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  );
}
