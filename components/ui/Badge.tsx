interface BadgeProps {
  variant?: "default" | "sale" | "new" | "muted";
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  default: "bg-ignition text-white",
  sale: "bg-redline text-white",
  new: "bg-white text-void",
  muted: "bg-carbon border border-border text-muted",
};

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`
        inline-block font-sub font-bold uppercase tracking-widest
        text-label rounded-none px-3 py-1
        ${variantClasses[variant]}
      `}
    >
      {children}
    </span>
  );
}
