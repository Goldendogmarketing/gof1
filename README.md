# Greek Olive Fusion

High-end Mediterranean ecommerce platform for Greek Olive Fusion, connected to the Ariston Specialties product world. Built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, Stripe Checkout, Auth.js/NextAuth, Resend, GSAP, and Framer Motion.

## What Is Included

- Premium storefront with sticky transparent header, cinematic hero, featured product carousel, shop filters, product detail pages, cart, checkout, and order confirmation.
- Scroll-driven Olive Journey: grove, Koroneiki olives, hand harvest, cold press, infusion, bottling, and table pairing.
- Admin dashboard for products, orders, customers, content, settings, featured products, feed sync, inventory visibility, and launch readiness.
- Flexible product feed layer in `src/lib/product-feed` with demo, generic JSON, and WooCommerce adapters.
- Prisma schema covering `User`, `Customer`, `Product`, `ProductVariant`, `ProductCategory`, `ProductImage`, `Inventory`, `Cart`, `CartItem`, `Order`, `OrderItem`, `DiscountCode`, `HomepageSection`, `JourneyScene`, `MediaAsset`, `Settings`, and `ApiSyncLog`.
- Stripe Checkout route with automatic tax, shipping options, discount code support, and webhook persistence.
- Resend transactional email hooks for order and contact messages.
- Vercel Cron configuration for scheduled product sync.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

Open `http://localhost:3000`.

The app works with demo data if `DATABASE_URL` is not set. For persistence, add a Vercel Postgres or Neon connection string, then run:

```bash
npm run db:push
npm run db:seed
```

Default seeded admin credentials come from:

```env
ADMIN_EMAIL="owner@greekolivefusion.com"
ADMIN_PASSWORD="change-me-before-launch"
```

Set stronger values before deployment.

## Product Feed

The product feed layer lives in:

```text
src/lib/product-feed
```

Adapters normalize external products into the internal product schema. The current adapters are:

- `demo`: uses seed/demo fallback products.
- `ariston-json`: fetches from `PRODUCT_FEED_URL` with optional `PRODUCT_FEED_TOKEN`.
- `woocommerce`: fetches from an Ariston/WooCommerce store using consumer key/secret credentials.

Configure:

```env
PRODUCT_FEED_ADAPTER="woocommerce"
WOOCOMMERCE_STORE_URL="https://www.aristonspecialties.com"
WOOCOMMERCE_CONSUMER_KEY="ck_..."
WOOCOMMERCE_CONSUMER_SECRET="cs_..."
CRON_SECRET="long-random-secret"
```

Manual sync:

```text
POST /api/admin/feed-sync
```

Scheduled sync:

```text
GET /api/cron/product-sync
Authorization: Bearer $CRON_SECRET
```

## Payments

The checkout flow at `/api/checkout` supports two providers, selected by
the `PAYMENT_PROVIDER` env var (`square` or `clover`). The default is
`square` so existing deployments keep working until the env var is flipped.

### Clover (Hosted Checkout)

```env
PAYMENT_PROVIDER="clover"
CLOVER_ENVIRONMENT="production"        # or "sandbox"
CLOVER_API_TOKEN="..."                  # Setup → API Tokens → "Hosted checkout"
CLOVER_MERCHANT_ID="0SRZ..."            # 13-char mId
CLOVER_WEBHOOK_SIGNATURE_KEY="..."      # generated when you register the webhook
```

Webhook endpoint: `/api/clover/webhook`. Register it in Clover at
Settings → Ecommerce → Hosted Checkout → Webhook URL, then paste the
generated signing secret into `CLOVER_WEBHOOK_SIGNATURE_KEY`.

### Square (legacy fallback)

```env
PAYMENT_PROVIDER="square"
SQUARE_ACCESS_TOKEN="..."
SQUARE_LOCATION_ID="..."
SQUARE_ENVIRONMENT="production"
SQUARE_WEBHOOK_SIGNATURE_KEY="..."
```

Webhook endpoint: `/api/square/webhook`. Listens for `payment.updated`.

### Stripe (unused — legacy)

```env
STRIPE_SECRET_KEY="sk_live_or_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

## Email (Resend)

Order emails are sent through [Resend](https://resend.com). When a Clover
webhook confirms a payment, the app fires **three** emails in parallel:

| Recipient | Env var | Purpose |
|---|---|---|
| The buyer | (n/a — order's `email`) | Receipt / order confirmation |
| Joe (owner) | `OWNER_NOTIFICATION_EMAIL` | "You got a paid order" alert |
| Drop-ship processor | `DROPSHIP_NOTIFICATION_EMAIL` | Full fulfillment packet (line items + shipping address + plain-text copy) |

### One-time setup for `greekolivefusion.com`

1. **Create Resend account** at https://resend.com using the owner's email.
2. **Verify the domain:** Resend dashboard → Domains → Add Domain → `greekolivefusion.com`.
   Resend will show 3 DNS records to add (one MX, one or two TXT — DKIM + SPF).
   Add them in your registrar's DNS panel; verification usually completes in <10 min.
3. **Create an API key:** Resend → API Keys → Create. Name it `greek-olive-fusion`.
   Permission: **Full access** (or restrict to **Send** if available).
4. **Add the env vars to Vercel** (Production + Preview + Development):

   ```env
   RESEND_API_KEY="re_..."
   ORDER_FROM_EMAIL="Greek Olive Fusion <orders@greekolivefusion.com>"
   OWNER_NOTIFICATION_EMAIL="joe@greekolivefusion.com"
   DROPSHIP_NOTIFICATION_EMAIL="fulfillment@your-dropship-partner.com"
   ```

5. **Redeploy** so the new env is picked up. The next paid order will trigger
   all three emails automatically.

> Until `RESEND_API_KEY` is set, every email send is silently skipped and the
> webhook still returns 200 to Clover — payments are not blocked.

## Vercel Deployment

1. Push this folder to GitHub.
2. Create a new Vercel project from the repository.
3. Add Vercel Postgres or Neon through Vercel Marketplace and copy `DATABASE_URL`.
4. Add optional Vercel Blob and Upstash Redis credentials for media uploads/caching.
5. Add Stripe, Resend, NextAuth, product feed, and cron environment variables.
6. Run `npm run db:push` and `npm run db:seed` locally or through a one-off deployment task.
7. Deploy. Vercel will run `npm install`, `prisma generate`, and `next build`.

## Notes

- `public/brand/greek-olive-fusion-hero.png` is a generated project-local hero asset.
- `public/brand/greek-olive-fusion-logo.svg` is a replaceable placeholder because no attached logo file was present in the workspace.
- Product art and journey scenes are local placeholders designed to be replaced by live feed images or Vercel Blob uploads.
