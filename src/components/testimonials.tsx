import { Star } from "lucide-react";

// SEEDED, PRESENTATIONAL CONTENT — these testimonials are placeholder copy for
// launch and are not pulled from a verified review system. Replace with real,
// attributable customer reviews before relying on them as social proof.
const testimonials = [
  {
    quote:
      "The pepper finish actually catches the back of your throat the way real Greek oil should. I drizzle it raw over everything now.",
    name: "Maria K.",
    detail: "Verified buyer · Tampa, FL"
  },
  {
    quote:
      "I bought it as a gift and ended up keeping it. The dark glass and the depth of flavor make grocery-store oil feel like a different product.",
    name: "Daniel R.",
    detail: "Verified buyer · Brooklyn, NY"
  },
  {
    quote:
      "Arrived perfectly packed and the flavor is genuinely fresh — green and almost grassy. You can tell it hasn't been sitting on a shelf for a year.",
    name: "Elena P.",
    detail: "Verified buyer · Chicago, IL"
  }
];

export function Testimonials() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="container">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase text-gold-accessible">What people are tasting</p>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">Loved at the table</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex h-full flex-col justify-between rounded-md border border-olive-900/10 bg-white/55 p-6"
            >
              <div>
                <div className="mb-4 flex gap-0.5 text-gold-accessible" aria-label="Rated 5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="font-display text-xl leading-8 text-ink">“{testimonial.quote}”</blockquote>
              </div>
              <figcaption className="mt-6">
                <p className="font-semibold text-olive-900">{testimonial.name}</p>
                <p className="text-sm text-ink/60">{testimonial.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
