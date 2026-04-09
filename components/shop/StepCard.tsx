import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Sparkles, ShoppingBag } from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  "01": <Upload size={20} />,
  "02": <Sparkles size={20} />,
  "03": <ShoppingBag size={20} />,
};

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

      <div
        className={`flex h-10 w-10 items-center justify-center ${
          highlighted ? "bg-white/20 text-white" : "bg-carbon text-muted"
        } border border-border`}
      >
        {STEP_ICONS[number]}
      </div>

      <h3 className="font-sub font-bold uppercase tracking-widest text-sm text-white">
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
        <Link href="/product/custom" className="mt-auto self-start">
          <Button
            variant={highlighted ? "outline" : "primary"}
            size="sm"
          >
            {ctaLabel}
          </Button>
        </Link>
      )}
    </Card>
  );
}
