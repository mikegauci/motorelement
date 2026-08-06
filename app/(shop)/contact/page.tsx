import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ContactForm } from "@/components/shop/contact/ContactForm";
import { ContactChannels } from "@/components/shop/contact/ContactChannels";
import { ContactOrderHelp } from "@/components/shop/contact/ContactOrderHelp";
import { ContactWholesale } from "@/components/shop/contact/ContactWholesale";
import { ContactFaqTeaser } from "@/components/shop/contact/ContactFaqTeaser";
import { CTABanner } from "@/components/shop/CTABanner";

export const metadata: Metadata = {
  title: "Contact — Motor Element",
  description:
    "Get in touch with Motor Element for order help, customizer questions, wholesale, and partnerships.",
};

function ContactFormFallback() {
  return (
    <div
      id="contact-form"
      className="min-h-[420px] border border-border bg-obsidian p-8"
      aria-hidden
    />
  );
}

export default function ContactPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-void py-16 md:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(220,38,38,0.18), transparent 55%), linear-gradient(180deg, #111111 0%, #0A0A0A 100%)",
          }}
        />
        <Container size="narrow" className="relative z-10 text-center">
          <div className="animate-contact-rise">
            <SectionLabel>CONTACT</SectionLabel>
            <h1 className="mt-3 font-heading text-display text-white md:text-hero">
              MOTOR ELEMENT
            </h1>
            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted">
              Questions about an order, the customizer, or working together —
              drop a line and we&apos;ll get back to you.
            </p>
            <div className="mt-8">
              <Link href="#contact-form">
                <Button variant="primary" size="lg">
                  WRITE TO US
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-void py-12 md:py-24">
        <Container size="form">
          <div className="mb-8 text-center md:mb-10">
            <SectionLabel>MESSAGE</SectionLabel>
            <h2 className="mt-2 font-heading text-display text-white">
              SEND A NOTE
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">
              Pick a topic so we can route your message to the right person.
            </p>
          </div>
          <Suspense fallback={<ContactFormFallback />}>
            <ContactForm />
          </Suspense>
        </Container>
      </section>

      <ContactChannels />
      <ContactOrderHelp />
      <ContactWholesale />
      <ContactFaqTeaser />
      <CTABanner />
    </main>
  );
}
