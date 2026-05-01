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
      <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-cream">
        <Image
          src={product.image}
          alt={product.images[0]?.alt ?? product.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        {product.compareAtCents ? (
          <Badge className="absolute left-4 top-4 border-gold-400/40 bg-parchment text-gold-600">Sale</Badge>
        ) : null}
      </Link>

      <div className="grid gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-olive-700/75">
            <span>{product.category}</span>
            <span>{product.size}</span>
          </div>
          <Link href={`/shop/${product.slug}`} className="block">
            <h3 className="font-display text-2xl text-ink transition group-hover:text-olive-700">{product.title}</h3>
          </Link>
          <p className="min-h-12 text-sm leading-6 text-ink/68">{product.shortDescription}</p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="leading-none">
            <span className="font-display text-2xl text-olive-900">{formatMoney(product.priceCents, product.currency)}</span>
            {product.compareAtCents ? (
              <span className="ml-2 text-sm text-ink/45 line-through">
                {formatMoney(product.compareAtCents, product.currency)}
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setQuickViewOpen(true)}
              aria-label={`Quick view ${product.title}`}
              title="Quick view"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => addItem(product)}
              aria-label={`Add ${product.title} to cart`}
              title="Add to cart"
            >
              <Plus className="size-4" />
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
