"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "./SectionWrapper";
import { SectionHeading } from "./SectionHeading";

const galleryItems = [
  {
    id: "supra",
    label: "SUPRA",
    before: "/images/gallery/builds/supra-before-1.jpg",
    after: "/images/gallery/builds/supra-after.jpg",
  },
  {
    id: "mustang",
    label: "MUSTANG",
    before: "/images/gallery/builds/mustang-before-1.jpg",
    after: "/images/gallery/builds/mustang-after-1.jpg",
  },
  {
    id: "nsx",
    label: "NSX",
    before: "/images/gallery/builds/nsx-before.jpg",
    after: "/images/gallery/builds/nsx-after.jpg",
  },
  {
    id: "landcruiser",
    label: "LAND CRUISER",
    before: "/images/gallery/builds/landcruise-before.jpg",
    after: "/images/gallery/builds/landcruiser-after.jpg",
  },
  {
    id: "mr2",
    label: "MR2",
    before: "/images/gallery/builds/mr2-before.jpeg",
    after: "/images/gallery/builds/mr2-after-1.jpg",
  },
  {
    id: "sw20",
    label: "SW20",
    before: "/images/gallery/builds/sw20-before-2.jpg",
    after: "/images/gallery/builds/sw20-after-2.jpg",
  },
];

type GalleryItem = (typeof galleryItems)[number];

const SWIPE_THRESHOLD = 50;

function shuffleItems(items: GalleryItem[]): GalleryItem[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function GalleryCard({ item }: { item: GalleryItem }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-carbon">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative aspect-[4/3]">
          <Image
            src={item.before}
            alt={`${item.label} before`}
            fill
            draggable={false}
            className="pointer-events-none select-none object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/70 to-transparent px-3 pb-1 pt-8">
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
            draggable={false}
            className="pointer-events-none select-none object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/70 to-transparent px-3 pb-1 pt-8">
            <span className="font-sub text-[10px] font-bold uppercase tracking-widest text-white/80 md:text-xs">
              After
            </span>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/images/gallery/arrow-red.png"
          alt=""
          width={400}
          height={262}
          draggable={false}
          className="h-14 w-auto rotate-90 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] md:h-20 md:rotate-0"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function GallerySection() {
  const [items, setItems] = useState<GalleryItem[]>(galleryItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [slideDistance, setSlideDistance] = useState(1);
  const activeIndexRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const axisLock = useRef<"x" | "y" | null>(null);
  const trackWidthRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(shuffleItems(galleryItems));
  }, []);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (items.length < 2 || isDragging || isHovered) return;
    const id = window.setInterval(() => {
      goTo(activeIndexRef.current + 1);
    }, 2500);
    return () => window.clearInterval(id);
  }, [items.length, isDragging, isHovered, activeIndex]);

  function wrapIndex(index: number) {
    if (items.length === 0) return 0;
    return ((index % items.length) + items.length) % items.length;
  }

  function goTo(index: number) {
    const current = activeIndexRef.current;
    const next = wrapIndex(index);
    setSlideDistance(Math.max(1, Math.abs(next - current)));
    setActiveIndex(next);
    dragOffsetRef.current = 0;
    setDragOffset(0);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (items.length < 2 || e.button !== 0) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    axisLock.current = null;
    trackWidthRef.current = viewportRef.current?.clientWidth ?? 0;
    dragOffsetRef.current = 0;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointerStart.current || !isDragging) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (!axisLock.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLock.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisLock.current === "y") {
        pointerStart.current = null;
        setIsDragging(false);
        dragOffsetRef.current = 0;
        setDragOffset(0);
        return;
      }
    }

    if (axisLock.current === "x") {
      e.preventDefault();
      dragOffsetRef.current = dx;
      setDragOffset(dx);
    }
  }

  function onPointerUp() {
    if (!pointerStart.current) {
      setIsDragging(false);
      dragOffsetRef.current = 0;
      setDragOffset(0);
      return;
    }

    const dx = dragOffsetRef.current;
    pointerStart.current = null;
    axisLock.current = null;
    setIsDragging(false);

    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      goTo(activeIndexRef.current + (dx < 0 ? 1 : -1));
    } else {
      dragOffsetRef.current = 0;
      setDragOffset(0);
    }
  }

  const width = trackWidthRef.current || 1;
  const dragPercent = isDragging ? (dragOffset / width) * 100 : 0;
  const transitionMs = 300 + (slideDistance - 1) * 180;

  return (
    <SectionWrapper>
      <Container>
        <SectionHeading
          eyebrow="COMMUNITY BUILDS"
          title="SEE WHAT'S BEEN MADE"
          subtitle="Before-and-afters from owners like you. Upload your ride and get your own."
        />

        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={viewportRef}
            className="touch-pan-y cursor-grab overflow-hidden active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className={`flex ${isDragging ? "" : "ease-out"}`}
              style={{
                transform: `translateX(calc(-${activeIndex * 100}% + ${dragPercent}%))`,
                transition: isDragging
                  ? undefined
                  : `transform ${transitionMs}ms ease-out`,
              }}
            >
              {items.map((item) => (
                <div key={item.id} className="w-full shrink-0">
                  <GalleryCard item={item} />
                </div>
              ))}
            </div>
          </div>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous build"
                className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-void/80 text-white backdrop-blur-sm transition hover:border-ignition hover:text-ignition md:left-3 md:flex"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next build"
                className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-void/80 text-white backdrop-blur-sm transition hover:border-ignition hover:text-ignition md:right-3 md:flex"
              >
                <ChevronRight size={20} />
              </button>

              <div className="mt-4 flex items-center justify-center gap-2">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Go to ${item.label}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    className={`h-2 rounded-full transition-all ${
                      index === activeIndex
                        ? "w-6 bg-ignition"
                        : "w-2 bg-white/25 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
}
