import { SectionLabel } from "@/components/ui/SectionLabel";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-8 text-center md:mb-12">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="mt-2 font-heading text-display text-white">{title}</h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-lg text-muted">{subtitle}</p>
      )}
    </div>
  );
}
