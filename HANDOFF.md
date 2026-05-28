# Handoff — Admin Price Override Feature

Last updated: 2026-05-27

## What's done

### Code (commit `238ef06` on `main`, deployed to https://gof1.vercel.app)
- New Prisma fields on `Product`: `priceOverridden` (Boolean), `feedPriceCents` (Int?), `feedCompareAtCents` (Int?).
- Feed sync (`src/lib/product-feed/sync.ts`) now preserves admin overrides:
  - Always writes `feedPriceCents` / `feedCompareAtCents` (the latest upstream price).
  - Only writes `priceCents` / `compareAtCents` when `priceOverridden = false`.
- Inline price editor at `/admin/products`:
  - Component: `src/components/admin/price-editor.tsx`
  - Two `$`-prefixed inputs (Price + MSRP), Save + Reset buttons, feed-price caption underneath.
  - Parent passes a `key` derived from `priceCents | compareAtCents | priceOverridden` so the inputs remount after a save.
- API: `PATCH /api/admin/products/[id]` accepts either:
  - `{ action: "override", priceCents, compareAtCents? }` — pins an override
  - `{ action: "reset" }` — drops the override, snaps back to `feedPriceCents`
- Validation in `src/lib/validations.ts` (`priceOverrideSchema` discriminated union).
- Storefront/checkout unchanged — they still read `priceCents`, which now reflects the override when one is set.

### Vercel (`golden-dog-marketing/gof1`)
- `ADMIN_EMAIL` = `bjbake6175@gmail.com` (Production + Development)
- `ADMIN_PASSWORD` = `Gracie2024` (Production + Development) — **TEMPORARY, replace with strong password before real use**
- Neon Postgres connected via Marketplace integration — `DATABASE_URL` + ~14 related `POSTGRES_*` / `PG*` vars set on Production + Preview.
- Latest production deploy: triggered after env vars were added, aliased to https://gof1.vercel.app.

## What's blocking (pick up here on laptop)

The price editor still won't function in production because **the Neon database has no schema yet**.

`prisma db push` couldn't be run from this machine because the Vercel Marketplace integration stores `DATABASE_URL` as a **sealed secret** — `vercel env pull` returns it as an empty string. Need the actual connection string from the Neon console.

### Next steps (on laptop)

1. **Get the Neon connection string**
   - https://console.neon.tech → open the project Vercel created
   - Dashboard → Connection string widget
   - Role: `neondb_owner` (default), Database: `neondb`, Pooled: ON
   - Copy the `postgresql://...@ep-...-pooler...neon.tech/neondb?sslmode=require` URL

2. **Run schema push + seed locally** (from project root):
   ```bash
   echo 'DATABASE_URL="<paste-the-neon-url-here>"' > .env
   echo 'ADMIN_EMAIL="bjbake6175@gmail.com"' >> .env
   echo 'ADMIN_PASSWORD="Gracie2024"' >> .env
   npm install
   npx prisma db push --accept-data-loss
   npx prisma db seed
   ```
   - `db push` creates all 17 tables including the new override columns.
   - `db seed` (`prisma/seed.ts`) loads 8 demo products + the admin user row + demo discount code + homepage section + storefront settings.

3. **Verify**
   - Visit https://gof1.vercel.app/account
   - Log in with `bjbake6175@gmail.com` / `Gracie2024`
   - Open `/admin/products` — should now show inline `Price` and `MSRP` inputs on each row instead of "Connect DATABASE_URL to edit prices."
   - Test: edit a price → Save → reload → confirm price stuck. Click "Sync Product Feed" → confirm the override survived.

4. **(Optional) Populate from real WooCommerce feed** instead of demo data
   - Click "Sync Product Feed" on `/admin/products` — uses the already-configured `WOOCOMMERCE_*` env vars to pull Ariston products into the DB.
   - On first sync, `priceOverridden = false` for every product, so live feed prices land directly in `priceCents`. After that, any admin override is preserved.

## Loose ends to address later

- **Password.** `Gracie2024` is weak. Replace via Vercel dashboard → Settings → Environment Variables → edit `ADMIN_PASSWORD`, then redeploy. Don't forget to update on Development env too if you use local dev.
- **Vercel token.** The token `vcp_2ANXqer...` used during setup should be revoked at https://vercel.com/account/tokens.
- **Live-feed products without DB row.** The admin page checks `hasDatabaseUrl()` to decide whether to render the editor, but doesn't check whether each *individual* product is DB-backed. If `getProducts()` falls through to the live-feed path (e.g. DB is connected but empty), the editor will render but PATCH will fail with "Record not found." Workaround: always click "Sync Product Feed" once after connecting the DB. Real fix: tag each `StoreProduct` with `isDbBacked` and check per-row.
- **Neon connection string in `.env`** (after step 2) — this is a production credential. Keep `.env` gitignored (it is) and don't commit it.

## Useful files

- Schema: `prisma/schema.prisma`
- Sync: `src/lib/product-feed/sync.ts`
- Admin page: `src/app/admin/products/page.tsx`
- Editor component: `src/components/admin/price-editor.tsx`
- PATCH route: `src/app/api/admin/products/[id]/route.ts`
- Validation: `src/lib/validations.ts`
- Auth: `src/lib/auth.ts` (env-admin path checks `ADMIN_EMAIL`/`ADMIN_PASSWORD` before DB)
