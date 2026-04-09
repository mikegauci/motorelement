interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="font-mono text-ignition uppercase text-xs tracking-widest">
      {children}
    </span>
  );
}
