# Greek Olive Fusion — Website Audit & Optimization Plan

**Date:** 2026-06-17
**Site:** https://www.greekolivefusion.com
**Stack:** Next.js 16 (App Router), TypeScript, Tailwind, Prisma/Postgres, NextAuth, Clover/Square checkout, Resend, GSAP/Framer Motion
**Method:** 5 parallel audits — Live Health · SEO · Codebase/Security · Design/UX · Copy/Content

---

## TL;DR — The verdict

**The site is live, stable, and well-built.** All 14 key routes return HTTP 200, HTTPS/HSTS are valid, the cart→checkout flow works end-to-end up to the payment hand-off, 112 real products render with photos, and the code is genuinely security-conscious (server-side price calc, signed webhooks, guarded admin routes). **There are no hard "site is down" blockers.**

The opportunity is in **conversion, brand polish, and search visibility** — these are where the site currently leaves money and traffic on the table:

| # | Highest-impact issue | Surfaced by | Effort |
|---|---|---|---|
| 1 | **Premium fonts never load** — site renders in Georgia/system fallback, silently breaking the luxury identity for ~99% of visitors | Design | 🟢 Low |
| 2 | **No `robots.txt` or `sitemap.xml`** (both 404 live) — Google can't efficiently discover 112 product URLs | SEO, Live | 🟢 Low |
| 3 | **No structured data (JSON-LD)** — zero rich results (price/availability), no knowledge-panel signals | SEO | 🟡 Med |
| 4 | **No reviews / social proof / trust band** anywhere — biggest pure-conversion drag for a sight-unseen premium food | Copy, Design | 🟡 Med |
| 5 | **Raw feed data in product titles** — "Ariston Basil Infused Olive oil 8.45 fl oz Code#679" shows on cards, PDPs, AND `<title>` tags | Copy, Design, SEO | 🟡 Med |
| 6 | **Shipping vs Terms contradiction** on US territories / APO-FPO — legal/operational risk | Copy | 🟢 Low |
| 7 | **Payment provider status unconfirmed** — code supports Clover+Square; `.env.production.local` has Square keys but no Clover keys. Need a confirmed live test order | Live, Code | 🟢 Low |

Everything below is organized into **6 phases**, ordered so the cheap-but-high-impact work comes first. Each item lists **what / why / where / effort**.

---

## PHASE 0 — Pre-launch blockers (do first)
*Small, high-impact fixes that protect revenue and the brand. ~1 day total.*

### 0.1 — Confirm payments actually process 🔴
- **What:** Place one real (or sandbox) test order through the live checkout to confirm the payment hand-off completes and the webhook marks the order PAID + fires the 3 Resend emails.
- **Why:** This is the only thing between "looks live" and "can take money." The live audit was (correctly) blocked from submitting a real transaction; the code review found `.env.production.local` contains `SQUARE_ACCESS_TOKEN` but **no Clover keys**, while the README/checkout default to Clover. So it's genuinely ambiguous which provider is wired in production. If neither is configured, checkout shows *"Payments are not yet configured. Please call (772) 528-5208."*
- **Where:** Vercel env (`PAYMENT_PROVIDER`, `CLOVER_*` / `SQUARE_*`); test via the live `/checkout`.
- **Effort:** 🟢 Low — but **do this first.**

### 0.2 — Load the actual brand fonts 🔴
- **What:** `tailwind.config.ts:39-43` declares Cormorant Garamond (display), Inter (sans), Cinzel (greek), but **nothing loads them** — no `next/font`, no `@font-face`, no Google Fonts link. Every serif heading falls back to Georgia; body to system sans.
- **Why:** Single highest-impact *visual* defect. The entire premium serif identity silently collapses to a generic look in production.
- **How:** Add `next/font/google` in `src/app/layout.tsx`, expose CSS variables on `<html>`, and reference them in `tailwind.config.ts` `fontFamily`. Resolve or remove the unused `Cinzel` (`font-greek` is declared but never used).
- **Where:** `src/app/layout.tsx`, `tailwind.config.ts`.
- **Effort:** 🟢 Low — ~1 file. Biggest brand ROI of any single change.

### 0.3 — Clean product titles on feed sync 🔴
- **What:** Live titles render raw Ariston strings: `Ariston Basil Infused Olive oil 8.45 fl oz Code#679` and 90-char bundle titles ending in `Bundle!`. These flow into product cards, PDP H1s, **and SEO `<title>` tags**.
- **Why:** Looks like scraped data, wastes SERP pixels, hurts the luxury framing and click-through.
- **How:** In the WooCommerce/Ariston sync adapter, strip `Code#NNN`, move size to a separate spec field, Title-Case the name, and cap bundle-title length. Keep the SKU internal-only.
- **Where:** `src/lib/product-feed/adapters/*`, `src/lib/product-feed/sync.ts`; display in `src/components/product-card.tsx`, `src/app/shop/[slug]/page.tsx`.
- **Effort:** 🟡 Med.

### 0.4 — Resolve the Shipping ↔ Terms contradiction 🔴
- **What:** `src/content/legal/shipping.ts:3` says they **ship** to US territories (PR, USVI, Guam) and APO/FPO; `src/content/legal/terms.ts:15` says they **do not**. Direct conflict.
- **Why:** Legal/operational exposure and customer confusion.
- **How:** Pick the true policy; align both files.
- **Effort:** 🟢 Low.

### 0.5 — Remove placeholder-looking artifacts from legal pages 🟡
- **What:** (a) Email renders as `[support@greekolivefusion.com]` — literal square brackets read as an unfilled template. (b) Privacy & Terms both end with a public-facing *"This is a starting template; please have it reviewed by a qualified attorney"* disclaimer.
- **Why:** Both signal "unfinished" to customers on live legal pages.
- **Where:** `src/content/legal/*.ts` (strip brackets); `privacy.ts:145`, `terms.ts:163` (remove disclaimer from rendered output).
- **Effort:** 🟢 Low.

### 0.6 — Fix cart display bugs 🟡
- **What:** (a) Cart line-item description renders the literal `&#8230;` instead of "…" (double-escaping). (b) The small cart-row thumbnail renders blank (PDP/shop images are fine). (c) One product ("Ariston Artichoke Tapenade 190g") uses a generic placeholder SVG instead of a real photo.
- **Where:** cart line-item rendering (`src/components/cart-page.tsx` + product data); the same double-encoding also corrupts PDP meta descriptions (see 1.4).
- **Effort:** 🟢 Low.

---

## PHASE 1 — SEO foundation (high ROI)
*Make the catalog discoverable and eligible for rich results. ~1–2 days.*

### 1.1 — Add `robots.txt` + XML sitemap 🔴
- **What:** Both return **404 live**. No `src/app/robots.ts` or `src/app/sitemap.ts` exist.
- **How:** Add `src/app/robots.ts` (allow all, disallow `/admin` `/account` `/checkout` `/cart`, reference the sitemap) and `src/app/sitemap.ts` (enumerate static routes + every product slug via `getProducts()`).
- **Why:** Nothing currently tells Google the 112 product URLs exist — they're only reachable via internal links.
- **Effort:** 🟢 Low. **Highest SEO ROI.**

### 1.2 — Add structured data (JSON-LD) 🔴
- **What:** Zero JSON-LD anywhere.
- **How:**
  - Sitewide (`layout.tsx`): `Organization` + `WebSite` (with `SearchAction`).
  - PDP (`shop/[slug]/page.tsx`): `Product` with `offers` (price, `priceCurrency`, `availability`, sku) + `BreadcrumbList`.
- **Why:** Unlocks price/availability rich results and brand knowledge-panel signals — the single biggest missed SEO opportunity.
- **Effort:** 🟡 Med.

### 1.3 — Add canonical tags 🔴
- **What:** No canonical tags on any page.
- **How:** Set `alternates.canonical` per route (self-canonical on PDPs).
- **Why:** Consolidates duplicate/param/tracking URLs and apex-vs-www; prevents ranking dilution.
- **Effort:** 🟢 Low.

### 1.4 — Fix PDP metadata quality 🟡
- **What:** PDP meta descriptions are double-encoded (`&amp;#8230;` renders literally in SERPs); PDP `<title>` includes `Code#NNN` SKU noise.
- **How:** Decode/sanitize `shortDescription` before use; strip SKU in `generateMetadata`.
- **Where:** `src/app/shop/[slug]/page.tsx:25-31`.
- **Effort:** 🟢 Low (overlaps with 0.3).

### 1.5 — Optimize Open Graph + social 🟡
- **What:** OG image is a **2.13 MB PNG** (over scraper limits); missing `og:type`, `og:url`, `og:site_name`, `og:locale`; `og:title` ("Greek Olive Fusion") is weaker than the `<title>`.
- **How:** Compress hero to a ≤1 MB 1200×630 WebP/JPG; add the missing OG fields in `layout.tsx`.
- **Effort:** 🟢 Low.

### 1.6 — Technical SEO cleanup 🟢
- `noindex` the `/checkout`, `/account`, `/cart` routes (`robots:{index:false}`).
- Make apex→www a **permanent 308/301** (currently a 307 temporary) in Vercel domain config.
- Strengthen the homepage `<title>` to lead with a money keyword (e.g. "Greek Extra Virgin Olive Oil") via a home-specific `metadata` export.
- **Effort:** 🟢 Low.

---

## PHASE 2 — Conversion & trust (biggest revenue lever)
*Where the catalog stops feeling like a feed import and starts selling. ~3–5 days.*

### 2.1 — Add reviews / social proof 🔴
- **What:** No reviews, ratings, or testimonials anywhere (confirmed across the whole site).
- **How:** Add a ratings/review block on the PDP and a testimonial strip on the homepage. (Even seeded/imported reviews + a review-request email post-purchase.) Feeds `AggregateRating` JSON-LD too.
- **Why:** For a premium consumable bought sight-unseen, this is the **single biggest conversion gap**.
- **Effort:** 🟡 Med–High.

### 2.2 — Add a homepage value-prop / trust band 🔴
- **What:** The site never answers *"why buy here vs. Amazon/grocery."* The strongest proof point — low acidity (0.2–0.4%) — is buried in one product description.
- **How:** Add a band covering: single-origin Koroneiki from Messinia · cold-pressed, 0.2–0.4% acidity · free shipping over $85 · damage/replacement guarantee.
- **Where:** `src/app/page.tsx`.
- **Effort:** 🟢 Low–Med.

### 2.3 — Add PDP variant selection 🔴
- **What:** "Flavor" and "Size" on the PDP are **static read-only labels**, not selectors. Each size/flavor is its own slug, so shoppers must go back to /shop to switch.
- **How:** Group sibling SKUs into variant selectors that swap price/image/slug in place.
- **Where:** `src/app/shop/[slug]/page.tsx:68-81`.
- **Effort:** 🟡 Med.

### 2.4 — Add PDP trust signals 🟡
- Shipping ETA, returns/satisfaction reassurance, and a guarantee badge directly on the product page (the generous damage policy is currently buried in `/returns`).
- **Effort:** 🟢 Low.

### 2.5 — Add-to-cart confirmation + free-shipping nudge 🟡
- **What:** Adding to cart only bumps the header badge — no toast or mini-cart. The free-shipping threshold only appears as a cart line item.
- **How:** Add a slide-out mini-cart / toast on add, plus a "You're $X from free shipping" progress nudge on PDP/cart.
- **Effort:** 🟡 Med.

### 2.6 — Render existing product copy + fix empty specs 🟡
- **What:** `shortDescription`/`subtitle` exist in the data model but are **never rendered** on cards. PDP "Size" spec renders **empty** for feed products.
- **How:** Render `shortDescription` under the card title; hide empty spec rows or backfill `size` from the feed.
- **Where:** `src/components/product-card.tsx`, `src/app/shop/[slug]/page.tsx:73-76`.
- **Effort:** 🟢 Low (data already exists — quick win).

### 2.7 — Contact page + FAQ 🟡
- Add the real phone (+1 772-528-5208) and mailing address to `/contact` (currently form-only, though both exist in the legal files).
- Add a `/faq` page (shipping, freshness, allergens, returns).
- **Effort:** 🟢 Low–Med.

---

## PHASE 3 — Design / UX & accessibility polish
*Tighten the premium feel and honor the published accessibility statement. ~2–3 days.*

### 3.1 — Make motion respect `prefers-reduced-motion` 🔴
- **What:** The CSS reduced-motion guard (`globals.css:63-72`) only covers CSS animations. The hero parallax (Framer) and scroll-pinned Olive Journey (GSAP) are JS-driven and **ignore the preference**; autoplay journey videos have no fallback.
- **How:** Gate Framer/GSAP/video behind `useReducedMotion()` / `matchMedia('prefers-reduced-motion')`.
- **Where:** `src/components/hero.tsx:10-13`, `src/components/olive-journey.tsx:16-35`.
- **Effort:** 🟢 Low–Med.

### 3.2 — Contrast audit (gold-on-light) 🔴/🟡
- **What:** Gold text accents (`text-gold-400/600`) on cream/parchment and over the hero photo are borderline-to-failing for WCAG AA. The `/accessibility` page **explicitly claims** AA contrast review — so reality must match the statement.
- **How:** Darken accents or add scrims; re-verify AA; reconcile the accessibility statement (`src/content/legal/accessibility.ts:16`).
- **Effort:** 🟢 Low–Med.

### 3.3 — Fix the hero hierarchy 🟡
- **What:** The punchy tagline ("Greek groves. Modern infusions. One table.") is demoted to a small eyebrow; a long descriptive sentence is the H1; CTAs render above the headline in DOM order.
- **How:** Promote the tagline to H1, make the sentence the sub, order CTAs after the copy.
- **Where:** `src/components/hero.tsx:31-56`.
- **Effort:** 🟢 Low.

### 3.4 — Navigation polish 🟡
- Add a **global product search** in the header (search currently only filters within `/shop`).
- Add **breadcrumbs** on the PDP (Home / Category / Product) — also helps SEO via `BreadcrumbList`.
- Reduce the very tall fixed header (135px band + `lg:pt-[240px]` page padding eats the fold).
- **Effort:** 🟡 Med.

### 3.5 — Imagery & brand assets 🟡
- Confirm the live logo is final, not the placeholder the README flags.
- Optimize the 2.1 MB hero PNG to AVIF/WebP (overlaps 1.5).
- Standardize product image fit (cards use `object-contain`, PDP uses `object-cover` → bottles crop oddly on PDP).
- **Effort:** 🟢 Low.

### 3.6 — Meta-commentary copy 🟡
- The Heritage band and About page literally describe the *copywriting brief* to customers ("The language is warmer and more immersive…"). Replace with benefit copy (rewrite suggestions in the appendix).
- **Where:** `src/components/heritage-band.tsx:18-20`, `src/app/about/page.tsx`.
- **Effort:** 🟢 Low.

---

## PHASE 4 — Code hardening & performance
*Defense-in-depth and a lighter bundle. None are exploited today. ~1–2 days.*

### 4.1 — Remove dead dependencies 🟢
- `three` and `@react-three/fiber` are in `package.json` but **imported nowhere** in `src`. Remove them.
- **Effort:** 🟢 Low.

### 4.2 — Close the CRON fail-open 🟡
- `/api/cron/product-sync` skips auth entirely if `CRON_SECRET` is unset (`expected` becomes `null`). Fail closed: return 503 in production when the secret is missing.
- **Where:** `src/app/api/cron/product-sync/route.ts:6-9`.
- **Effort:** 🟢 Low.

### 4.3 — Verify paid amount in webhooks 🟡
- Square/Clover webhooks mark orders PAID **without comparing the paid amount to `order.totalCents`**. Low real-world risk, but add the check for defense-in-depth.
- **Where:** `src/app/api/square/webhook/route.ts:46-58`, `src/app/api/clover/webhook/route.ts`.
- **Effort:** 🟢 Low.

### 4.4 — Replace `prisma db push` in the build 🟡
- The build runs `prisma db push --skip-generate`, which can silently drop columns on a destructive diff and keeps no migration history. Move to `prisma migrate deploy` and start a migration history.
- **Where:** `package.json:7`.
- **Effort:** 🟡 Med.

### 4.5 — Fix lint + typecheck hygiene 🟡
- `npm run lint` fails on a real error: `featured-toggle.tsx:21` calls `setState` synchronously in `useEffect` — derive during render or use a key reset.
- `npm run typecheck` fails only on **stale `.next/types`** referencing a moved route; `rm -rf .next` clears it. Ensure CI runs on a clean checkout.
- **Effort:** 🟢 Low.

### 4.6 — Lazy-load heavy animation 🟢
- GSAP (Olive Journey) and Framer (hero/carousel) load with the homepage's first client bundle. Wrap below-the-fold animated sections in `next/dynamic` to trim initial JS / improve CWV.
- **Effort:** 🟢 Low–Med.

### 4.7 — Harden the dormant Stripe handler 🟢
- If Stripe is ever re-enabled: it generates a fresh `orderNumber()` per event and trusts `session.amount_total` blindly. Add idempotency + amount verification before reuse.
- **Where:** `src/app/api/stripe/webhook/route.ts`.
- **Effort:** 🟢 Low (only if re-enabling Stripe).

---

## PHASE 5 — Content & growth (ongoing)
*Compounding organic traffic and list-building. Ongoing.*

- **5.1 — Launch a blog / recipes / pairing guides.** No long-form content exists; `/pairings` is a stub (one headline + 4 cards). Target informational keywords ("olive oil tasting guide", "what is Koroneiki olive oil", "olive oil & balsamic pairings", recipe posts) that internally link to PDPs. 🟡
- **5.2 — Build crawlable category landing pages** (`/shop/olive-oil`, `/shop/balsamic`, `/shop/gifts`) with unique copy + product grids. Filtering is currently client-side only, so no category URLs exist to rank. 🟡
- **5.3 — Add newsletter / email capture** (footer + post-purchase). None exists today → no remarketing list. 🟢
- **5.4 — Target transactional keywords** in copy/metadata: "Greek olive oil", "Koroneiki extra virgin olive oil", "infused olive oil", "balsamic gift set", "Mediterranean gift baskets". 🟡

---

## Appendix — Copy rewrites (from the content audit)

**1. Product title (worst offender)**
- Before: `Ariston Basil Infused Olive oil 8.45 fl oz Code#679`
- After (display): **Basil-Infused Extra Virgin Olive Oil** · size `250 ml / 8.45 fl oz` as a spec · SKU hidden
- After (SEO `<title>`): *"Basil-Infused Greek Olive Oil — Koroneiki, Messinia | Greek Olive Fusion"*

**2. Heritage / About meta-commentary**
- Before: *"…The language is warmer and more immersive, but the promise stays grounded in quality, taste, aroma, and texture."*
- After: **"Born from the Ariston tradition of Greek olive oils, balsamics, and honey, every bottle traces back to a single grove in Messinia — Koroneiki olives, cold-pressed and bottled in dark glass to protect the aroma, texture, and clean pepper finish that define a great oil."**

**3. About feature card (too terse)**
- Before — *Method:* "Extra virgin oil made by crushing olives without chemical refining."
- After: **"Cold-pressed, never chemically refined. Our Koroneiki oil is crushed within hours of harvest at acidity as low as 0.2%, locking in the green-almond aroma and peppery finish that mass-market oils lose on the shelf."**

---

## Suggested sequencing

1. **This week:** Phase 0 (blockers) + Phase 1 (SEO foundation) — cheap, high-impact, protects launch.
2. **Next:** Phase 2 (conversion/trust) — the revenue lever.
3. **Then:** Phase 3 (design/a11y polish) + Phase 4 (code hardening) in parallel.
4. **Ongoing:** Phase 5 (content/SEO growth).

Tell me which phase (or individual items) to start implementing and I'll execute them.
