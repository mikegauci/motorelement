import Link from "next/link";
import { Upload, Sparkles, Shirt } from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  "01": <Upload size={48} strokeWidth={1.5} />,
  "02": <Sparkles size={48} strokeWidth={1.5} />,
  "03": <Shirt size={48} strokeWidth={1.5} />,
};

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  highlighted?: boolean;
  ctaHref?: string;
}

export function StepCard({
  number,
  title,
  description,
  ctaHref = "/product/custom",
}: StepCardProps) {
  return (
    <Link href={ctaHref} className="block">
      <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-obsidian mt:p-10 p-8 md:min-h-[420px] transition-colors duration-300 hover:bg-ignition hover:border-ignition cursor-pointer">
        <span className="absolute top-0 right-5 font-heading md:text-[190px] text-[100px] leading-none text-white/[0.06] group-hover:text-white/20 transition-colors duration-300">
          {number}
        </span>

        <div className="relative z-10 flex flex-1 flex-col gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-carbon text-muted border border-border transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/20">
            {STEP_ICONS[number]}
          </div>

          <h3 className="font-heading md:mt-20 mt-4 md:text-6xl text-4xl text-white">
            {title}
          </h3>

          <p className="text-base leading-relaxed text-muted transition-colors duration-300 group-hover:text-white/80">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
