"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Link2, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";
import type { StoreProduct } from "@/lib/types";

export function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const { addItem } = useCart();
  const [copied, setCopied] = React.useState(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    },
    []
  );

  async function handleCopyLink() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/shop/${product.slug}` : `/shop/${product.slug}`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== "undefined") {
        const input = document.createElement("input");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // swallow: clipboard blocked
    }
  }

  return (
    <article className="group grid h-full overflow-hidden rounded-md border border-olive-900/10 bg-white/65 shadow-soft backdrop-blur">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-cream sm:aspect-[4/5]">
        <Image
          src={product.image}
          alt={product.images[0]?.alt ?? product.title}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="object-contain p-3 transition duration-700 group-hover:scale-105"
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
          {product.shortDescription || product.subtitle ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-ink/55">
              {product.shortDescription || product.subtitle}
            </p>
          ) : null}
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
              onClick={handleCopyLink}
              aria-label={copied ? `Link copied for ${product.title}` : `Copy share link for ${product.title}`}
              title={copied ? "Link copied" : "Copy share link"}
              className="h-8 min-h-8 w-8 p-0"
            >
              {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
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

    </article>
  );
}
