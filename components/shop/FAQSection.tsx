import { ChevronDown } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Container } from "@/components/ui/Container";

const faqs = [
  {
    question: "How does the AI design process work?",
    answer:
      "It's a simple 3-step process. First, upload a high-quality photo of your car — any make, model, or angle works. Our AI then generates multiple unique artistic renders of your vehicle in seconds, each with a different style. You get to pick the one you love, customize the background, colors, and text, then place it on the product of your choice. The whole thing takes under 5 minutes.",
  },
  {
    question: "What's the print quality like?",
    answer:
      "We use premium DTG (Direct to Garment) printing on heavyweight 100% cotton apparel. This means your design is printed directly into the fabric — not on top of it — so it feels soft to the touch and won't crack, peel, or fade after washing. Posters and canvases are produced on archival-grade materials with vivid, true-to-screen color accuracy.",
  },
  {
    question: "What if I'm not happy with my order?",
    answer:
      "We stand behind every product we ship. If there's a print defect, damage during shipping, or your order doesn't match what you designed, contact our support team and we'll arrange a free reprint or full refund — no questions asked. We want you to be stoked every time you wear your build.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Once you place your order, production takes 2–5 business days. After that, shipping typically takes 5–10 business days depending on your location. We ship worldwide and you'll receive a tracking number as soon as your order leaves the facility. Need it faster? Expedited options are available at checkout.",
  },
  {
    question: "What products can I put my design on?",
    answer:
      "Right now we offer t-shirts, hoodies, posters, canvases, and mugs — with more product types on the way. Each product is sourced from trusted suppliers and printed on demand, so your design is always fresh and made just for you.",
  },
  {
    question: "Can I use any car photo?",
    answer:
      "Absolutely. Our AI handles everything from JDM legends to European exotics, American muscle, trucks, and motorcycles. Any angle works — front, rear, 3/4, rolling shot, you name it. For the best results, use a clear and well-lit photo where your vehicle is the main subject with minimal obstructions.",
  },
];

export function FAQSection() {
  return (
    <section className="bg-void py-12 md:py-24">
      <Container size="narrow">
        <div className="mb-8 text-center md:mb-12">
          <SectionLabel>SUPPORT</SectionLabel>
          <h2 className="mt-2 font-heading text-display text-white">
            FREQUENTLY ASKED
          </h2>
        </div>

        <div className="border-t border-border">
          {faqs.map((faq, index) => (
            <details
              key={index}
              name="motorelement-faq"
              className="group border-b border-border"
              // React 18 @types/react omit defaultOpen on <details>; it is valid in the DOM.
              {...(index === 0 ? ({ defaultOpen: true } as React.HTMLAttributes<HTMLDetailsElement>) : {})}
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 py-6 text-left [&::-webkit-details-marker]:hidden">
                <span className="font-sub text-base font-bold uppercase tracking-widest text-white">
                  {faq.question}
                </span>
                <ChevronDown
                  size={20}
                  className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180 group-open:text-ignition"
                  aria-hidden
                />
              </summary>
              <p className="pb-6 text-sm leading-relaxed text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
