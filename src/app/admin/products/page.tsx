import Image from "next/image";
import { PriceEditor } from "@/components/admin/price-editor";
import { ProductForm } from "@/components/admin/product-form";
import { SyncButton } from "@/components/admin/sync-button";
import { Badge } from "@/components/ui/badge";
import { hasDatabaseUrl } from "@/lib/db";
import { getProducts } from "@/lib/products";

// Always re-fetch — prices change frequently when the admin edits them.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts();
  const dbBacked = hasDatabaseUrl();

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Catalog</p>
          <h1 className="font-display text-5xl text-ink">Products</h1>
          <p className="mt-2 max-w-xl text-sm text-ink/60">
            Edit any price inline to override the value coming from the product feed. Overrides survive feed syncs;
            use <span className="font-semibold">Reset</span> to drop the override and snap back to the latest feed price.
          </p>
        </div>
        <SyncButton />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-md border border-olive-900/10 bg-white/60 shadow-soft">
          <div className="grid gap-1 p-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="grid grid-cols-[72px_1fr_auto] items-center gap-4 border-b border-olive-900/10 py-4 last:border-b-0"
              >
                <div className="relative aspect-square overflow-hidden rounded-sm bg-cream">
                  <Image src={product.image} alt={product.title} fill className="object-cover" sizes="72px" />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-ink">{product.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{product.category}</Badge>
                    {product.isFeatured ? <Badge className="border-gold-400/40 text-gold-600">Featured</Badge> : null}
                    {product.priceOverridden ? (
                      <Badge className="border-gold-400/40 text-gold-600">Price override</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-ink/50">{product.inventory.quantity} in stock</p>
                </div>
                {dbBacked ? (
                  <PriceEditor
                    // Remount when the persisted price/override changes so the inputs reflect
                    // the new saved values.
                    key={`${product.id}-${product.priceCents}-${product.compareAtCents ?? "n"}-${product.priceOverridden ? 1 : 0}`}
                    productId={product.id}
                    currency={product.currency}
                    priceCents={product.priceCents}
                    compareAtCents={product.compareAtCents}
                    feedPriceCents={product.feedPriceCents}
                    feedCompareAtCents={product.feedCompareAtCents}
                    priceOverridden={product.priceOverridden}
                  />
                ) : (
                  <p className="text-right text-xs text-ink/60">
                    Connect <code className="font-mono">DATABASE_URL</code> to edit prices.
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
        <ProductForm />
      </div>
    </section>
  );
}
