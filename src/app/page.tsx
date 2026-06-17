import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { HeritageBand } from "@/components/heritage-band";
import { OliveJourney } from "@/components/olive-journey";
import { PairingsBand } from "@/components/pairings-band";
import { ProductCarousel } from "@/components/product-carousel";
import { Testimonials } from "@/components/testimonials";
import { ValuePropBand } from "@/components/value-prop-band";
import { getFeaturedProducts, getJourneyScenes } from "@/lib/products";

// Regenerate the homepage at most once a minute so a freshly synced product
// catalog reaches the featured carousel without hand-busting the cache.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Greek Extra Virgin Olive Oil — Koroneiki, Cold-Pressed | Greek Olive Fusion",
  description:
    "Single-origin Koroneiki extra virgin olive oil from Messinia, Greece. Cold-pressed at 0.2–0.4% acidity in dark glass. Free shipping over $85.",
  alternates: { canonical: "/" }
};

export default async function HomePage() {
  const [featuredProducts, journeyScenes] = await Promise.all([getFeaturedProducts(), getJourneyScenes()]);

  return (
    <main>
      <Hero />
      <ValuePropBand />
      <ProductCarousel products={featuredProducts.slice(0, 4)} />
      <OliveJourney scenes={journeyScenes} />
      <PairingsBand />
      <Testimonials />
      <HeritageBand />
    </main>
  );
}
