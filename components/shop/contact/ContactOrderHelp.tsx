import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/shop/SectionWrapper";
import { SectionHeading } from "@/components/shop/SectionHeading";

export function ContactOrderHelp() {
  return (
    <SectionWrapper>
      <Container size="narrow" className="text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center text-ignition">
          <PackageSearch size={36} strokeWidth={1.5} />
        </div>
        <SectionHeading
          eyebrow="ORDERS"
          title="NEED HELP WITH AN ORDER?"
          subtitle="Include your order number and the email you used at checkout. We’ll dig in and get you sorted."
        />
        <Link href="/contact?topic=order#contact-form">
          <Button variant="secondary" size="lg">
            START AN ORDER REQUEST
          </Button>
        </Link>
      </Container>
    </SectionWrapper>
  );
}
