import { Award, Truck, ShieldCheck, Zap } from "lucide-react";
import { Container } from "@/components/ui/Container";

const valueProps = [
  {
    icon: <Award size={28} strokeWidth={1.5} />,
    title: "Premium Quality",
    description: "DTG printed on heavyweight apparel",
  },
  {
    icon: <Truck size={28} strokeWidth={1.5} />,
    title: "Fast Shipping",
    description: "Produced & shipped within days",
  },
  {
    icon: <ShieldCheck size={28} strokeWidth={1.5} />,
    title: "Satisfaction Guarantee",
    description: "Not happy? We'll make it right",
  },
  {
    icon: <Zap size={28} strokeWidth={1.5} />,
    title: "AI-Powered Design",
    description: "Unique renders in seconds",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-obsidian py-8 md:py-12">
      <Container>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {valueProps.map((prop) => (
            <div key={prop.title} className="flex flex-col items-center gap-3 text-center">
              <div className="text-ignition">{prop.icon}</div>
              <h3 className="font-sub text-sm font-bold uppercase tracking-widest text-white">
                {prop.title}
              </h3>
              <p className="text-sm text-muted">{prop.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
