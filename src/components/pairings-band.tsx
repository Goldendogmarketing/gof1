import { pairings } from "@/lib/demo-data";

export function PairingsBand() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="container">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase text-gold-accessible">Pairings</p>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">A pantry built around finishing moments</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {pairings.map((pairing) => (
            <article key={pairing.oil} className="rounded-md border border-olive-900/10 bg-white/55 p-5">
              <h3 className="font-display text-2xl text-olive-900">{pairing.oil}</h3>
              <p className="mt-2 text-sm font-semibold text-terracotta">{pairing.food}</p>
              <p className="mt-4 text-sm leading-7 text-ink/68">{pairing.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
