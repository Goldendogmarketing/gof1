"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";
import { calculateShippingCents } from "@/lib/shipping";

export function CartPage() {
  const { lines, removeItem, updateQuantity, subtotalCents, itemCount } = useCart();
  const shippingCents = calculateShippingCents(subtotalCents, itemCount);
  const totalCents = subtotalCents + shippingCents;

  if (!lines.length) {
    return (
      <div className="container grid min-h-[60vh] place-items-center py-16 text-center">
        <div className="max-w-md space-y-5">
          <h1 className="font-display text-5xl text-ink">Your cart is waiting.</h1>
          <p className="leading-7 text-ink/65">Start with Koroneiki extra virgin, then add a bright infusion.</p>
          <Button asChild>
            <Link href="/shop">Shop Olive Oils</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container grid gap-8 py-12 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {lines.map((line) => (
          <article key={line.product.id} className="grid gap-5 rounded-md border border-olive-900/10 bg-white/55 p-4 sm:grid-cols-[132px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-sm bg-cream">
              <Image src={line.product.image} alt={line.product.title} fill className="object-cover" sizes="132px" />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-display text-2xl text-ink">{line.product.title}</h2>
                <p className="mt-2 text-sm text-ink/60">{line.product.shortDescription}</p>
                <p className="mt-3 text-sm font-semibold text-olive-700">
                  {formatMoney(line.product.priceCents, line.product.currency)}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:items-start">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                  aria-label={`Decrease ${line.product.title} quantity`}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="grid h-9 min-w-10 place-items-center rounded-sm bg-cream text-sm font-semibold">
                  {line.quantity}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                  aria-label={`Increase ${line.product.title} quantity`}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(line.product.id)}
                  aria-label={`Remove ${line.product.title}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-md border border-olive-900/10 bg-olive-900 p-6 text-cream shadow-soft">
        <h2 className="font-display text-3xl">Order Summary</h2>
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatMoney(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{shippingCents ? formatMoney(shippingCents) : "Free"}</dd>
          </div>
          <div className="mt-3 flex justify-between border-t border-white/10 pt-4 font-display text-3xl">
            <dt>Total</dt>
            <dd>{formatMoney(totalCents)}</dd>
          </div>
        </dl>
        <Button asChild variant="gold" className="mt-6 w-full">
          <Link href="/checkout">Checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
