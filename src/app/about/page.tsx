import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description: "Greek Olive Fusion brand story and Ariston Specialties connection."
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <section className="container grid items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase text-gold-accessible">About</p>
          <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
            A single Messinian grove, bottled with care.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink/70">
            Born from the Ariston tradition of Greek olive oils, balsamics, and honey, every bottle traces back to a
            single grove in Messinia — Koroneiki olives, cold-pressed and bottled in dark glass to protect the
            aroma, texture, and clean pepper finish that define a great oil.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-olive-900 shadow-soft">
          <Image src="/brand/greek-olive-fusion-hero.png" alt="Greek Olive Fusion Mediterranean table" fill className="object-cover" sizes="50vw" />
        </div>
      </section>
      <section className="bg-olive-900 py-16 text-cream">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            ["Origin", "Koroneiki olive oil rooted in Messinia, Greece."],
            [
              "Method",
              "Cold-pressed, never chemically refined. Our Koroneiki oil is crushed within hours of harvest at acidity as low as 0.2%, locking in the green-almond aroma and peppery finish that mass-market oils lose on the shelf."
            ],
            ["Table", "Infusions and pairings designed for bread, salads, fish, pasta, cheese, and vegetables."]
          ].map(([title, body]) => (
            <article key={title} className="rounded-md border border-white/10 p-6">
              <h2 className="font-display text-3xl">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-cream/72">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
