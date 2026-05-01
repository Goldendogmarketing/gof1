import type { Metadata } from "next";
import { OliveJourney } from "@/components/olive-journey";
import { getJourneyScenes } from "@/lib/products";

export const metadata: Metadata = {
  title: "Olive Journey",
  description: "Follow Greek Olive Fusion from Greek groves and Koroneiki olives through harvest, cold press, infusion, bottle, and table."
};

export default async function OliveJourneyPage() {
  const scenes = await getJourneyScenes();

  return (
    <main className="pt-20">
      <section className="bg-parchment py-20">
        <div className="container max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Olive Journey</p>
          <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
            From Messinia groves to the final pour at the table.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink/68">
            Grove, fruit, family harvest, cold extraction, infusion, bottling, and pairing in one continuous arc.
          </p>
        </div>
      </section>
      <OliveJourney scenes={scenes} />
    </main>
  );
}
