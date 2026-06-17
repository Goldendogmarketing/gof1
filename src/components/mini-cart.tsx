"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { FreeShippingBar } from "@/components/free-shipping-bar";
import { decodeEntities, useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";

/**
 * Slide-out cart drawer driven entirely by provider UI state. It opens whenever
 * addItem runs (see cart-provider), which is how adds from product cards get a
 * confirmation without product-card.tsx importing anything from here.
 */
export function MiniCart() {
  const { lines, removeItem, updateQuantity, subtotalCents, itemCount, isOpen, closeCart } = useCart();

  // Close on Escape and lock body scroll while the drawer is open.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeCart]);

  return (
    <div
      className={isOpen ? "fixed inset-0 z-[60]" : "pointer-events-none fixed inset-0 z-[60]"}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-parchment shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-olive-900/10 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
            <ShoppingBag className="size-5 text-olive-700" />
            Your Cart {itemCount > 0 ? <span className="text-base text-ink/55">({itemCount})</span> : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="inline-flex size-9 items-center justify-center rounded-sm text-olive-900 transition hover:bg-olive-700/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-700"
          >
            <X className="size-5" />
          </button>
        </header>

        {lines.length ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {lines.map((line) => (
                  <li
                    key={line.product.id}
                    className="grid grid-cols-[64px_1fr_auto] gap-3 rounded-md border border-olive-900/10 bg-white/55 p-3"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-sm bg-cream">
                      <Image
                        src={line.product.image}
                        alt={line.product.images[0]?.alt ?? line.product.title}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/shop/${line.product.slug}`}
                        onClick={closeCart}
                        className="block truncate font-display text-base text-ink transition hover:text-olive-700"
                      >
                        {line.product.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink/55">
                        {decodeEntities(line.product.shortDescription)}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                          aria-label={`Decrease ${line.product.title} quantity`}
                          className="grid size-7 place-items-center rounded-sm border border-olive-700/20 bg-cream text-olive-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-700"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-7 text-center text-sm font-semibold text-ink">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                          aria-label={`Increase ${line.product.title} quantity`}
                          className="grid size-7 place-items-center rounded-sm border border-olive-700/20 bg-cream text-olive-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-700"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        type="button"
                        onClick={() => removeItem(line.product.id)}
                        aria-label={`Remove ${line.product.title}`}
                        className="text-ink/45 transition hover:text-olive-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-700"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <span className="text-sm font-semibold text-olive-700">
                        {formatMoney(line.product.priceCents * line.quantity, line.product.currency)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="space-y-4 border-t border-olive-900/10 bg-white/40 px-5 py-4">
              <FreeShippingBar subtotalCents={subtotalCents} />
              <div className="flex items-center justify-between font-display text-xl text-ink">
                <span>Subtotal</span>
                <span>{formatMoney(subtotalCents)}</span>
              </div>
              <p className="text-xs text-ink/55">Shipping calculated at checkout.</p>
              <div className="grid gap-2">
                <Button asChild variant="gold" className="w-full">
                  <Link href="/checkout" onClick={closeCart}>
                    Checkout
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/cart" onClick={closeCart}>
                    View cart
                  </Link>
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <ShoppingBag className="size-10 text-olive-700/40" />
            <div className="space-y-1">
              <p className="font-display text-2xl text-ink">Your cart is empty.</p>
              <p className="text-sm text-ink/60">Start with a Koroneiki extra virgin, then add a bright infusion.</p>
            </div>
            <Button asChild>
              <Link href="/shop" onClick={closeCart}>
                Shop Olive Oils
              </Link>
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
