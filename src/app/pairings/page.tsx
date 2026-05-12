import type { Metadata } from "next";
import Link from "next/link";
import { PairingsBand } from "@/components/pairings-band";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pairings",
  description: "Mediterranean pairing guide for Greek Olive Fusion extra virgin and infused olive oils."
};

export default function PairingsPage() {
  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <section className="container py-12">
        <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Pairings</p>
        <h1 className="max-w-4xl font-display text-5xl leading-tight text-ink sm:text-6xl">
          Match the bottle to the dish, then let the oil finish the story.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/68">
          Build a tasting board, finish grilled fish, dress a salad, or add a bright herb note to pasta.
        </p>
        <Button asChild className="mt-8">
          <Link href="/shop">Shop pairings</Link>
        </Button>
      </section>
      <PairingsBand />
    </main>
  );
}
