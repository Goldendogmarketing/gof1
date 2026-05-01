import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeritageBand() {
  return (
    <section className="relative overflow-hidden bg-parchment py-16 sm:py-24">
      <div className="grain-overlay absolute inset-0 opacity-50" />
      <div className="container relative grid items-center gap-10 md:grid-cols-[1fr_0.8fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Connected to Ariston Specialties</p>
          <h2 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
            Traditional olive harvesting, high-end technique, and a modern infusion pantry.
          </h2>
        </div>
        <div className="space-y-6 text-base leading-8 text-ink/70">
          <p>
            Greek Olive Fusion is designed around the Ariston world of Greek olive oils, infused oils, balsamics,
            honey, pairings, and gourmet products. The language is warmer and more immersive, but the promise stays
            grounded in quality, taste, aroma, and texture.
          </p>
          <Button asChild variant="secondary">
            <Link href="/about">
              About the brand
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
