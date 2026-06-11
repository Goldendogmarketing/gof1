import { Hero } from "@/components/hero";
import { HeritageBand } from "@/components/heritage-band";
import { OliveJourney } from "@/components/olive-journey";
import { PairingsBand } from "@/components/pairings-band";
import { ProductCarousel } from "@/components/product-carousel";
import { getFeaturedProducts, getJourneyScenes } from "@/lib/products";

// Regenerate the homepage at most once a minute so a freshly synced product
// catalog reaches the featured carousel without hand-busting the cache.
export const revalidate = 60;

export default async function HomePage() {
  const [featuredProducts, journeyScenes] = await Promise.all([getFeaturedProducts(), getJourneyScenes()]);

  return (
    <main>
      <Hero />
      <ProductCarousel products={featuredProducts.slice(0, 4)} />
      <OliveJourney scenes={journeyScenes} />
      <PairingsBand />
      <HeritageBand />
    </main>
  );
}
