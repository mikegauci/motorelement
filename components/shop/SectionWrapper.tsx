import type { ReactNode } from "react";

interface SectionWrapperProps {
  children: ReactNode;
  bg?: "void" | "obsidian";
  className?: string;
  id?: string;
}

export function SectionWrapper({
  children,
  bg = "void",
  className = "",
  id,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`bg-${bg} py-12 md:py-24 ${className}`.trim()}
    >
      {children}
    </section>
  );
}
