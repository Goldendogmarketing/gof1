import type { Metadata } from "next";
import { ShopClient } from "@/components/shop-client";
import { getProductFacets, getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop Olive Oils",
  description: "Shop Greek Olive Fusion extra virgin olive oils, infused olive oils, bundles, and Mediterranean pairings."
};

export default async function ShopPage() {
  const [products, facets] = await Promise.all([getProducts(), getProductFacets()]);

  return (
    <main className="min-h-screen pt-28">
      <section className="container py-10">
        <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Shop</p>
        <h1 className="max-w-3xl font-display text-5xl leading-tight text-ink sm:text-6xl">
          Extra virgin, infused, and bundled for the Mediterranean table.
        </h1>
      </section>
      <ShopClient products={products} facets={facets} />
    </main>
  );
}
