import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "./SectionWrapper";
import { SectionHeading } from "./SectionHeading";

const galleryItems = [
  {
    id: "supra",
    label: "SUPRA",
    before: "/images/gallery/builds/supra-before.png",
    after: "/images/gallery/builds/supra-after.png",
  },
];

export function GallerySection() {
  return (
    <SectionWrapper>
      <Container>
        <SectionHeading
          eyebrow="COMMUNITY BUILDS"
          title="SEE WHAT'S BEEN MADE"
          subtitle="Before-and-afters from owners like you. Upload your ride and get your own."
        />

        <div className="grid gap-3">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-xl border border-border bg-carbon"
            >
              <div className="grid grid-cols-2">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.before}
                    alt={`${item.label} before`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 40vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/70 to-transparent px-3 pb-3 pt-8">
                    <span className="font-sub text-[10px] font-bold uppercase tracking-widest text-white/80 md:text-xs">
                      Before
                    </span>
                  </div>
                </div>
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.after}
                    alt={`${item.label} after`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 40vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/70 to-transparent px-3 pb-3 pt-8">
                    <span className="font-sub text-[10px] font-bold uppercase tracking-widest text-white/80 md:text-xs">
                      After
                    </span>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 items-center">
                <svg
                  viewBox="0 0 80 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-14 w-24 text-ignition drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] md:h-20 md:w-32"
                  aria-hidden
                >
                  <path
                    d="M6 30c14-14 36-18 58-10"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M52 8l18 12-16 14"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
