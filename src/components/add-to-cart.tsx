"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import type { StoreProduct } from "@/lib/types";

export function AddToCart({ product, label = "Add to Cart" }: { product: StoreProduct; label?: string }) {
  const { addItem } = useCart();

  return (
    <Button onClick={() => addItem(product)} size="lg">
      <ShoppingBag className="size-5" />
      {label}
    </Button>
  );
}
