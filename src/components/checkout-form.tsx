"use client";

import * as React from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";

export function CheckoutForm() {
  const { lines, subtotalCents } = useCart();
  const [email, setEmail] = React.useState("");
  const [discountCode, setDiscountCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        discountCode,
        items: lines.map((line) => ({
          productId: line.product.id,
          slug: line.product.slug,
          quantity: line.quantity
        }))
      })
    });

    const body = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(body.error ?? "Checkout could not be started.");
      return;
    }

    window.location.href = body.url;
  }

  return (
    <form onSubmit={submit} className="grid gap-6 rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft">
      <div>
        <label className="mb-2 block text-sm font-semibold text-olive-900" htmlFor="email">
          Email
        </label>
        <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-olive-900" htmlFor="discount">
          Discount code
        </label>
        <Input
          id="discount"
          value={discountCode}
          onChange={(event) => setDiscountCode(event.target.value)}
          placeholder="TABLE10"
        />
      </div>
      <div className="rounded-sm bg-cream p-4 text-sm text-ink/70">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(subtotalCents)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span>Shipping and tax</span>
          <span>Calculated at checkout</span>
        </div>
      </div>
      {error ? <p className="text-sm font-semibold text-terracotta">{error}</p> : null}
      <Button type="submit" size="lg" disabled={loading || !lines.length}>
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-5" />}
        Continue to secure checkout
      </Button>
    </form>
  );
}
