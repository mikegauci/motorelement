import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/shop/SectionWrapper";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { contactFaqTeaserIds, faqs } from "@/lib/shop/faqs";

export function ContactFaqTeaser() {
  const items = contactFaqTeaserIds.map((index) => faqs[index]);

  return (
    <SectionWrapper>
      <Container size="narrow">
        <SectionHeading
          eyebrow="SUPPORT"
          title="QUICK ANSWERS"
          subtitle="Common questions before you write in."
        />
        <div className="border-t border-border">
          {items.map((faq, index) => (
            <details
              key={faq.question}
              name="contact-faq-teaser"
              className="group border-b border-border"
              {...(index === 0
                ? ({
                    defaultOpen: true,
                  } as React.HTMLAttributes<HTMLDetailsElement>)
                : {})}
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
        <div className="mt-10 text-center">
          <Link href="/#faq">
            <Button variant="ghost" size="md">
              VIEW ALL FAQ
            </Button>
          </Link>
        </div>
      </Container>
    </SectionWrapper>
  );
}
