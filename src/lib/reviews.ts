// Product reviews — GATED OFF until we have real customer reviews from sales.
//
// By default `getProductReviews` returns an EMPTY summary (count 0), so the PDP
// renders no reviews section and emits no AggregateRating JSON-LD. This is
// deliberate: publishing seeded/placeholder reviews — or AggregateRating markup
// for reviews that aren't genuine — violates Google's review-snippet policy and
// can earn a manual penalty. We only show reviews once they're real.
//
// The seeded generator below is kept ONLY as a design/preview aid and is off in
// production. To preview the reviews UI locally, set
// NEXT_PUBLIC_ENABLE_SEEDED_REVIEWS=true.
//
// FOLLOW-UP (the real fix): persist genuine customer reviews (a `Review` model +
// a POST endpoint + moderation), then swap `getProductReviews` to read from the
// database. The PDP component and JSON-LD already consume the shape below, so
// only this module changes when the backend lands.

// Off by default — never emit placeholder reviews in production.
const SEEDED_REVIEWS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SEEDED_REVIEWS === "true";

/** Empty summary used while reviews are gated (the default in production). */
const EMPTY_SUMMARY: ProductReviewSummary = { average: 0, count: 0, reviews: [] };

export type ProductReview = {
  author: string;
  rating: number; // 1–5
  title: string;
  body: string;
  date: string; // ISO date
};

export type ProductReviewSummary = {
  average: number; // rounded to 1 decimal
  count: number;
  reviews: ProductReview[];
};

// Fixed pool of believable reviews. Indices are picked deterministically from
// the product slug so the selection is stable but varies between products.
const REVIEW_POOL: Array<Omit<ProductReview, "date">> = [
  { author: "Maria K.", rating: 5, title: "Restaurant quality at home", body: "Smooth, fresh, and genuinely fragrant. It has replaced everything else on our counter." },
  { author: "James P.", rating: 5, title: "Better than the specialty shop", body: "Finishing oil that actually tastes like olives. Drizzled it over grilled fish and it was perfect." },
  { author: "Sofia R.", rating: 4, title: "Lovely flavor, lasts a while", body: "A little goes a long way. Knocked off one star only because I wish the bottle were bigger." },
  { author: "Daniel M.", rating: 5, title: "Gift-worthy", body: "Bought it as a present and ended up ordering two more for myself. Beautiful aroma." },
  { author: "Elena T.", rating: 5, title: "The real thing", body: "Peppery, grassy, exactly what good Greek oil should be. Shipping was quick and well packed." },
  { author: "Chris D.", rating: 4, title: "Great everyday oil", body: "Clean taste for cooking and finishing alike. Will reorder." },
  { author: "Anna L.", rating: 5, title: "Caprese never tasted better", body: "Bright and balanced. Family keeps asking what changed about the salad." },
  { author: "Nikos V.", rating: 5, title: "Tastes like my yiayia's kitchen", body: "Authentic, fresh, and the bottle arrived perfectly protected. Highly recommend." }
];

// Simple, stable string hash so a product slug maps to a repeatable selection.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Deterministic, read-only review summary for a product. Always returns the same
 * data for the same slug. Replace with a DB-backed read when reviews are
 * persisted (see module header).
 */
export function getProductReviews(slug: string): ProductReviewSummary {
  // Gated: no reviews (and therefore no AggregateRating) until they're real.
  if (!SEEDED_REVIEWS_ENABLED) return EMPTY_SUMMARY;

  const seed = hashString(slug);
  // 3–5 reviews per product, deterministically chosen from the pool.
  const count = 3 + (seed % 3);
  const reviews: ProductReview[] = [];

  for (let i = 0; i < count; i += 1) {
    const picked = REVIEW_POOL[(seed + i * 7) % REVIEW_POOL.length];
    // Stable, recent-looking dates spaced a few weeks apart.
    const daysAgo = 9 + ((seed + i * 13) % 120);
    const date = new Date(Date.UTC(2026, 5, 1) - daysAgo * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    reviews.push({ ...picked, date });
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = Math.round((total / reviews.length) * 10) / 10;

  return { average, count: reviews.length, reviews };
}
