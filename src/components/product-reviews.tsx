import { Star } from "lucide-react";
import type { ProductReviewSummary } from "@/lib/reviews";

function Stars({ rating, className }: { rating: number; className?: string }) {
  // Render 5 stars, filling whole stars up to the (rounded) rating.
  const rounded = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={index}
          className={`size-4 ${index < rounded ? "fill-gold-400 text-gold-400" : "fill-none text-olive-900/25"}`}
        />
      ))}
    </span>
  );
}

/**
 * Presentational reviews section for the PDP: average rating, review count, and
 * a few review cards. Data comes from the seeded `getProductReviews` helper
 * (read-only — submission is a follow-up; see src/lib/reviews.ts). The numeric
 * average is also surfaced into AggregateRating JSON-LD by the PDP.
 */
export function ProductReviews({ summary }: { summary: ProductReviewSummary }) {
  if (!summary || summary.count === 0) return null;

  return (
    <section aria-labelledby="reviews-heading" className="border-t border-olive-900/10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-heading" className="font-display text-3xl text-ink">
            Customer reviews
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <Stars rating={summary.average} />
            <span className="text-sm text-ink/70">
              <span className="font-semibold text-ink">{summary.average.toFixed(1)}</span> out of 5
              <span className="px-1.5 text-ink/35">·</span>
              {summary.count} review{summary.count === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {summary.reviews.map((review, index) => (
          <li
            key={`${review.author}-${index}`}
            className="rounded-md border border-olive-900/10 bg-white/55 p-4 shadow-soft"
          >
            <div className="flex items-center justify-between gap-2">
              <Stars rating={review.rating} className="shrink-0" />
              <time dateTime={review.date} className="text-xs text-ink/45">
                {new Date(review.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </time>
            </div>
            <p className="mt-2 font-semibold text-ink">{review.title}</p>
            <p className="mt-1 text-sm leading-6 text-ink/70">{review.body}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-olive-700/80">{review.author}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
