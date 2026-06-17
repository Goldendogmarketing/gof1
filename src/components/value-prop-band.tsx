import { Droplet, Leaf, ShieldCheck, Truck } from "lucide-react";

const valueProps = [
  {
    icon: Leaf,
    title: "Single-origin Koroneiki",
    body: "Grown in one grove in Messinia, Greece — not blended from anonymous, mixed-country oils."
  },
  {
    icon: Droplet,
    title: "Cold-pressed, low acidity",
    body: "Crushed within hours of harvest at 0.2–0.4% acidity, the mark of true extra virgin oil."
  },
  {
    icon: Truck,
    title: "Free shipping over $85",
    body: "Flat, honest rates below that — your order ships free once you cross the threshold."
  },
  {
    icon: ShieldCheck,
    title: "Damage-free guarantee",
    body: "Arrives breakage-free or we replace it. No quibbling, no return shipping on us."
  }
];

export function ValuePropBand() {
  return (
    <section className="border-y border-olive-900/10 bg-parchment py-12 sm:py-16">
      <div className="container">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-accessible">Why Greek Olive Fusion</p>
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Real provenance, the way grocery-aisle oil never tells you.
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="flex flex-col gap-3 rounded-md border border-olive-900/10 bg-white/55 p-5"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-olive-700/10 text-olive-700">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-xl text-olive-900">{title}</h3>
              <p className="text-sm leading-7 text-ink/70">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
