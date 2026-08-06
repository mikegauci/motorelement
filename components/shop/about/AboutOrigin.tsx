import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/shop/SectionWrapper";
import { SectionHeading } from "@/components/shop/SectionHeading";

export function AboutOrigin() {
  return (
    <SectionWrapper id="origin" bg="void">
      <Container size="narrow" className="animate-about-fade-up">
        <SectionHeading
          eyebrow="ORIGIN · EST. 2018"
          title="BUILT FROM THE DRIVER'S SEAT"
        />
        <div className="space-y-6 text-base leading-relaxed text-muted">
          <p>
            Motor Element started in 2018 from a simple frustration: most
            &quot;car merch&quot; never featured your actual car. Stock
            silhouettes. Generic logos. Nothing that felt like the build you
            spent nights wrenching on.
          </p>
          <p>
            Our founder is a car enthusiast first — someone who lives the
            culture, not a print shop chasing trends. The goal was apparel that
            puts your ride front and center: JDM-inspired, street-ready, and
            personal enough to wear with pride.
          </p>
          <p>
            Years later, that idea still drives everything we make. Upload your
            car, shape the art, and take your build with you — on a tee, a
            hoodie, or whatever you choose to rep.
          </p>
        </div>
      </Container>
    </SectionWrapper>
  );
}
