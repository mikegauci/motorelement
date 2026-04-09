import { HeroSection } from "@/components/shop/HeroSection";
import { HowItWorksSection } from "@/components/shop/HowItWorksSection";
import { FeaturedBuildsSection } from "@/components/shop/FeaturedBuildsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturedBuildsSection />
    </>
  );
}
