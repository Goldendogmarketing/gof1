"use client";

import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import type { VariantOption } from "@/lib/products";

/**
 * Variant picker for sibling products that differ by size. Each variant is its
 * own PDP (its own slug), so selecting one navigates to that variant's page,
 * which reflects its own price and image. Add-to-cart is intentionally untouched.
 *
 * Renders nothing when there are fewer than two siblings, so it degrades
 * gracefully when no reliable grouping data exists.
 */
export function ProductVariants({ variants, label = "Size" }: { variants: VariantOption[]; label?: string }) {
  const router = useRouter();

  if (!variants || variants.length < 2) return null;

  return (
    <div className="space-y-3">
      <span className="block text-sm font-semibold uppercase tracking-wide text-olive-700">{label}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`Choose ${label.toLowerCase()}`}>
        {variants.map((variant) => {
          const isCurrent = variant.isCurrent;
          return (
            <button
              key={variant.slug}
              type="button"
              aria-pressed={isCurrent}
              aria-current={isCurrent ? "true" : undefined}
              disabled={isCurrent}
              onClick={() => router.push(`/shop/${variant.slug}`)}
              className={[
                "flex min-w-[5.5rem] flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm transition",
                isCurrent
                  ? "cursor-default border-olive-700 bg-olive-700/5 ring-1 ring-olive-700"
                  : "border-olive-900/15 bg-white/60 hover:border-olive-700/50 hover:bg-white",
                !variant.inStock ? "opacity-60" : ""
              ].join(" ")}
            >
              <span className="font-medium text-ink">{variant.label}</span>
              <span className="text-xs text-ink/55">
                {formatMoney(variant.priceCents, variant.currency)}
                {!variant.inStock ? " · Back soon" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
