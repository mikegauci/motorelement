import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "./SectionWrapper";
import { SectionHeading } from "./SectionHeading";

const galleryItems = [
  { id: 1, label: "SUPRA MK4", span: "col-span-1 row-span-1" },
  { id: 2, label: "R34 GT-R", span: "col-span-1 row-span-2" },
  { id: 3, label: "RX-7 FD", span: "col-span-1 row-span-1" },
  { id: 4, label: "AE86", span: "col-span-2 row-span-1" },
  { id: 5, label: "NSX", span: "col-span-1 row-span-1" },
  { id: 6, label: "EVO IX", span: "col-span-1 row-span-1" },
];

export function GallerySection() {
  return (
    <SectionWrapper>
      <Container>
        <SectionHeading
          eyebrow="COMMUNITY SHOWCASE"
          title="FROM GARAGE TO GALLERY"
          subtitle="Real designs created by our community. Upload your ride and see what our AI can do."
        />

        <div className="grid auto-rows-[200px] grid-cols-2 gap-3 md:grid-cols-3 lg:auto-rows-[240px]">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-xl border border-border bg-carbon ${item.span}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading text-[48px] text-white/[0.06] transition-colors duration-300 group-hover:text-white/10 lg:text-[64px]">
                  {item.label}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-void/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="font-sub text-xs font-bold uppercase tracking-widest text-white">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
