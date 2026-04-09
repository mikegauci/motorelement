import { HeroSection } from "@/components/shop/HeroSection";
import { HowItWorksSection } from "@/components/shop/HowItWorksSection";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { FeaturedBuildsSection } from "@/components/shop/FeaturedBuildsSection";
import { GallerySection } from "@/components/shop/GallerySection";
import { ReviewsSection } from "@/components/shop/ReviewsSection";
import { FAQSection } from "@/components/shop/FAQSection";
import { CTABanner } from "@/components/shop/CTABanner";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <TrustStrip />
      <FeaturedBuildsSection />
      <GallerySection />
      <ReviewsSection />
      <FAQSection />
      <CTABanner />
    </>
  );
}
