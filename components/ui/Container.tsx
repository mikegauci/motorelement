import type { ReactNode } from "react";

/**
 * Shared horizontal layout for page sections. Use the component or `containerClass`
 * so max-width and gutters stay consistent (matches header/footer: max-w-7xl, px-6).
 */
export const containerClass = {
  /** Shop pages, hero, grids — same width as Header / Footer */
  page: "mx-auto w-full max-w-7xl px-6",
  /** Long-form copy, FAQ */
  narrow: "mx-auto w-full max-w-3xl px-6",
  /** Checkout, order confirmation, account forms */
  form: "mx-auto w-full max-w-2xl px-6",
} as const;

/** Side padding only — use inside full-bleed sections (e.g. carousels) so edges line up with `page` */
export const containerGutter = "px-6";

export type ContainerSize = keyof typeof containerClass;

interface ContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
}

export function Container({
  children,
  size = "page",
  className = "",
}: ContainerProps) {
  return (
    <div className={`${containerClass[size]} ${className}`.trim()}>
      {children}
    </div>
  );
}
