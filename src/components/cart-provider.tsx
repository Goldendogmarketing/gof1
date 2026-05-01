"use client";

import * as React from "react";
import type { StoreProduct } from "@/lib/types";

type CartState = {
  lines: Array<{ product: StoreProduct; quantity: number }>;
  addItem(product: StoreProduct, quantity?: number): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  clearCart(): void;
  itemCount: number;
  subtotalCents: number;
};

const CartContext = React.createContext<CartState | null>(null);
const storageKey = "greek-olive-fusion-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<Array<{ product: StoreProduct; quantity: number }>>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    queueMicrotask(() => {
      if (saved) setLines(JSON.parse(saved));
      setHydrated(true);
    });
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [hydrated, lines]);

  const addItem = React.useCallback((product: StoreProduct, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line
        );
      }

      return [...current, { product, quantity }];
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.product.id !== productId));
  }, []);

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      current
        .map((line) => (line.product.id === productId ? { ...line, quantity: Math.max(1, quantity) } : line))
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const clearCart = React.useCallback(() => setLines([]), []);

  const value = React.useMemo<CartState>(() => {
    const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotalCents = lines.reduce((total, line) => total + line.product.priceCents * line.quantity, 0);

    return { lines, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotalCents };
  }, [addItem, clearCart, lines, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider.");
  return context;
}
