import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeritageBand() {
  return (
    <section className="relative overflow-hidden bg-parchment py-16 sm:py-24">
      <div className="grain-overlay absolute inset-0 opacity-50" />
      <div className="container relative grid items-center gap-10 md:grid-cols-[1fr_0.8fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase text-gold-accessible">Connected to Ariston Specialties</p>
          <h2 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
            Traditional olive harvesting, high-end technique, and a modern infusion pantry.
          </h2>
        </div>
        <div className="space-y-6 text-base leading-8 text-ink/70">
          <p>
            Born from the Ariston tradition of Greek olive oils, balsamics, and honey, every bottle traces back to
            a single grove in Messinia — Koroneiki olives, cold-pressed and bottled in dark glass to protect the
            aroma, texture, and clean pepper finish that define a great oil.
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
