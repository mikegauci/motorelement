import { Award, Truck, ShieldCheck, Globe } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/shop/SectionWrapper";
import { SectionHeading } from "@/components/shop/SectionHeading";

const values = [
  {
    icon: Award,
    title: "Premium DTG Print",
    description: "Heavyweight cotton apparel with sharp, lasting prints.",
  },
  {
    icon: Globe,
    title: "Printed On Demand",
    description: "Made when you order — less waste, worldwide reach.",
  },
  {
    icon: Truck,
    title: "Fast Turnaround",
    description: "Produced in days, then shipped to your door.",
  },
  {
    icon: ShieldCheck,
    title: "Satisfaction Guarantee",
    description: "Defects get a free reprint or a full refund.",
  },
];

export function AboutValues() {
  return (
    <SectionWrapper bg="void">
      <Container>
        <SectionHeading
          eyebrow="THE STANDARD"
          title="WHAT WE STAND FOR"
          subtitle="Quality you can feel, shipping you can trust, and a guarantee that backs every order."
        />
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="flex flex-col items-center gap-3 text-center transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="text-ignition">
                <value.icon size={28} strokeWidth={1.5} />
              </div>
              <h3 className="font-sub text-sm font-bold uppercase tracking-widest text-white">
                {value.title}
              </h3>
              <p className="text-sm text-muted">{value.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
