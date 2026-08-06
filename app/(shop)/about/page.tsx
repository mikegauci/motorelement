import type { Metadata } from "next";
import { AboutHero } from "@/components/shop/about/AboutHero";
import { AboutOrigin } from "@/components/shop/about/AboutOrigin";
import { AboutCraft } from "@/components/shop/about/AboutCraft";
import { AboutValues } from "@/components/shop/about/AboutValues";
import { CTABanner } from "@/components/shop/CTABanner";

export const metadata: Metadata = {
  title: "About — Motor Element",
  description:
    "Founded in 2018 by a car enthusiast. Motor Element creates custom car apparel with AI generation and in-house designers — JDM-inspired, built for the street.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutOrigin />
      <AboutCraft />
      <AboutValues />
      <CTABanner />
    </>
  );
}
