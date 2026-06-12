"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import type { StoreProduct } from "@/lib/types";

export function AddToCart({
  product,
  label = "Add to Cart"
}: {
  product: StoreProduct;
  label?: string;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const inStock = product.inventory.quantity > 0 || !product.inventory.visible;

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => q + 1);
  }

  function handleAdd() {
    addItem(product, quantity);
    setQuantity(1);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-md border border-olive-900/15 bg-white/65 p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={decrement}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </Button>
        <span
          className="min-w-8 text-center font-semibold text-ink"
          aria-live="polite"
          aria-label={`Quantity: ${quantity}`}
        >
          {quantity}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={increment}
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <Button onClick={handleAdd} size="lg" disabled={!inStock}>
        <ShoppingBag className="size-5" />
        {inStock ? label : "Out of stock"}
      </Button>
    </div>
  );
}
