import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/shop/SectionWrapper";
import { SectionHeading } from "@/components/shop/SectionHeading";

export function ContactWholesale() {
  return (
    <SectionWrapper bg="obsidian">
      <Container size="narrow" className="text-center">
        <SectionHeading
          eyebrow="BUSINESS"
          title="WHOLESALE & PARTNERSHIPS"
          subtitle="Shops, clubs, and brands — talk to us about bulk runs, collabs, and white-label builds."
        />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/contact?topic=wholesale#contact-form">
            <Button variant="primary" size="lg">
              WHOLESALE INQUIRY
            </Button>
          </Link>
          <Link href="/contact?topic=partnership#contact-form">
            <Button variant="secondary" size="lg">
              PARTNERSHIP INQUIRY
            </Button>
          </Link>
        </div>
      </Container>
    </SectionWrapper>
  );
}
