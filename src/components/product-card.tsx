"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Plus, ShoppingBag } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";
import type { StoreProduct } from "@/lib/types";

export function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const { addItem } = useCart();
  const [quickViewOpen, setQuickViewOpen] = React.useState(false);

  return (
    <article className="group grid h-full overflow-hidden rounded-md border border-olive-900/10 bg-white/65 shadow-soft backdrop-blur">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-cream">
        <Image
          src={product.image}
          alt={product.images[0]?.alt ?? product.title}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        {product.compareAtCents ? (
          <Badge className="absolute left-3 top-3 border-gold-400/40 bg-parchment text-[10px] text-gold-600">Sale</Badge>
        ) : null}
      </Link>

      <div className="grid gap-3 p-3 sm:p-4">
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-olive-700/75">
            <span>{product.category}</span>
            <span className="px-1 text-olive-700/40">·</span>
            <span>{product.size}</span>
          </div>
          <Link href={`/shop/${product.slug}`} className="block">
            <h3 className="line-clamp-2 font-display text-base leading-snug text-ink transition group-hover:text-olive-700 sm:text-lg">
              {product.title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="leading-none">
            <span className="font-display text-lg text-olive-900">{formatMoney(product.priceCents, product.currency)}</span>
            {product.compareAtCents ? (
              <span className="ml-1.5 text-xs text-ink/45 line-through">
                {formatMoney(product.compareAtCents, product.currency)}
              </span>
            ) : null}
          </div>
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setQuickViewOpen(true)}
              aria-label={`Quick view ${product.title}`}
              title="Quick view"
              className="h-8 min-h-8 w-8 p-0"
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => addItem(product)}
              aria-label={`Add ${product.title} to cart`}
              title="Add to cart"
              className="h-8 min-h-8 w-8 p-0"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {quickViewOpen ? (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} quick view`}
          onClick={() => setQuickViewOpen(false)}
        >
          <div
            className="grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-md bg-parchment shadow-glow md:grid-cols-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative min-h-80 bg-cream">
              <Image src={product.image} alt={product.title} fill className="object-cover" sizes="50vw" />
            </div>
            <div className="grid content-between gap-6 p-6">
              <div className="space-y-4">
                <Badge>{product.category}</Badge>
                <h2 className="font-display text-4xl text-ink">{product.title}</h2>
                <p className="leading-7 text-ink/70">{product.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="mr-auto font-display text-3xl text-olive-900">
                  {formatMoney(product.priceCents, product.currency)}
                </span>
                <Button variant="secondary" onClick={() => setQuickViewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => addItem(product)}>
                  <ShoppingBag className="size-4" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
