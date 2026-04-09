interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const sizeClasses: Record<string, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const variantClasses: Record<string, string> = {
  primary: "bg-ignition text-white hover:bg-ignition/90",
  secondary:
    "bg-carbon border border-border text-white hover:bg-white/10",
  outline:
    "bg-transparent border border-white text-white hover:bg-white hover:text-void",
  ghost: "bg-transparent text-muted hover:text-white",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-sub font-bold uppercase tracking-widest
        rounded-none transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
