interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-obsidian border border-border rounded-none p-6 ${className}`}
    >
      {children}
    </div>
  );
}
