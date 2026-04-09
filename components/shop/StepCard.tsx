import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  highlighted?: boolean;
  ctaLabel?: string;
}

export function StepCard({
  number,
  title,
  description,
  highlighted = false,
  ctaLabel,
}: StepCardProps) {
  return (
    <Card
      className={`flex flex-col gap-4 ${
        highlighted ? "bg-ignition border-ignition" : ""
      }`}
    >
      <span
        className={`font-heading text-display ${
          highlighted ? "text-white/30" : "text-white/10"
        }`}
      >
        {number}
      </span>

      {/* TODO: replace with actual icon */}
      <div
        className={`h-10 w-10 ${
          highlighted ? "bg-white/20" : "bg-carbon"
        } border border-border`}
      />

      <h3
        className={`font-sub font-bold uppercase tracking-widest text-sm ${
          highlighted ? "text-white" : "text-white"
        }`}
      >
        {title}
      </h3>

      <p
        className={`text-sm ${
          highlighted ? "text-white/80" : "text-muted"
        }`}
      >
        {description}
      </p>

      {ctaLabel && (
        <Button
          variant={highlighted ? "outline" : "primary"}
          size="sm"
          className="mt-auto self-start"
        >
          {ctaLabel}
        </Button>
      )}
    </Card>
  );
}
