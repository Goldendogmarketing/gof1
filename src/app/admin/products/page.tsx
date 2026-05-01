import Image from "next/image";
import { ProductForm } from "@/components/admin/product-form";
import { SyncButton } from "@/components/admin/sync-button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { getProducts } from "@/lib/products";

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Catalog</p>
          <h1 className="font-display text-5xl text-ink">Products</h1>
        </div>
        <SyncButton />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-md border border-olive-900/10 bg-white/60 shadow-soft">
          <div className="grid gap-1 p-4">
            {products.map((product) => (
              <article key={product.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 border-b border-olive-900/10 py-4 last:border-b-0">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-cream">
                  <Image src={product.image} alt={product.title} fill className="object-cover" sizes="72px" />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-ink">{product.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{product.category}</Badge>
                    {product.isFeatured ? <Badge className="border-gold-400/40 text-gold-600">Featured</Badge> : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-olive-900">{formatMoney(product.priceCents, product.currency)}</p>
                  <p className="text-xs text-ink/50">{product.inventory.quantity} in stock</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <ProductForm />
      </div>
    </section>
  );
}
