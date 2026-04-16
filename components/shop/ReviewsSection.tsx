import { Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Container, containerGutter } from "@/components/ui/Container";
import { SectionWrapper } from "./SectionWrapper";
import { SectionHeading } from "./SectionHeading";

const reviews = [
  {
    id: "3ei9vagiJ",
    name: "Matthew S.",
    rating: 5,
    review: "Excellent customer service",
    date: "Dec 2024",
    verified: true,
  },
  {
    id: "OAiCcSR0P",
    name: "Liam V.",
    rating: 5,
    review:
      "A very well put together website and stellar customer support made it super easy and pleasant to shop with you guys",
    date: "Dec 2024",
    verified: true,
  },
  {
    id: "x1hTw1odR",
    name: "Grenzpaket B.",
    rating: 5,
    review:
      "The support was great and helped me a lot, thank you very much",
    date: "Apr 2025",
    verified: true,
  },
  {
    id: "w25mgDLmR",
    name: "Blake A.",
    rating: 5,
    review:
      "The whole process was great and was easy to do. Michael was great also!",
    date: "May 2025",
    verified: true,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? "fill-ignition text-ignition" : "text-border"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
  return (
    <Card className="flex w-[340px] shrink-0 flex-col gap-4">
      <StarRating rating={review.rating} />
      <p className="flex-1 text-sm leading-relaxed text-white/80">
        &ldquo;{review.review}&rdquo;
      </p>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="font-sub text-sm font-bold uppercase tracking-widest text-white">
            {review.name}
          </p>
          <p className="text-xs text-muted">{review.date}</p>
        </div>
        {review.verified && <Badge variant="muted">Verified</Badge>}
      </div>
    </Card>
  );
}

export function ReviewsSection() {
  const doubled = [...reviews, ...reviews];

  return (
    <SectionWrapper bg="obsidian">
      <Container>
        <SectionHeading eyebrow="VERIFIED REVIEWS" title="WHAT THE COMMUNITY SAYS" />
      </Container>

      <div className="overflow-hidden">
        <div className={`animate-scroll-left flex gap-6 ${containerGutter}`}>
          {doubled.map((review, i) => (
            <ReviewCard key={`${review.id}-${i}`} review={review} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
