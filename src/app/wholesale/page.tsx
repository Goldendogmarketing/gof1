import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Wholesale",
  description: "Wholesale olive oil cases, bundles, and pairings for restaurants, grocers, tasting rooms, and gift programs."
};

export default function WholesalePage() {
  return (
    <main className="min-h-screen pt-28">
      <section className="container grid items-center gap-10 py-12 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Wholesale</p>
          <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
            Premium Mediterranean oils for restaurants, grocers, and gifting.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/68">
            Source single-origin EVOO, infused oils, tasting bundles, pairing kits, and seasonal gift assortments with
            inventory visibility and owner-managed publishing.
          </p>
          <Button asChild className="mt-8">
            <Link href="/contact">Start a wholesale conversation</Link>
          </Button>
        </div>
        <div className="grid gap-4">
          {["Restaurant finishing oils", "Specialty retail cases", "Corporate tasting gifts", "Pairing and pantry bundles"].map(
            (item) => (
              <div key={item} className="rounded-md border border-olive-900/10 bg-white/60 p-5 font-display text-2xl text-ink shadow-soft">
                {item}
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
