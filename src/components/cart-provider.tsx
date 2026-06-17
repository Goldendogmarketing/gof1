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
  // Mini-cart drawer UI state. Adding an item also opens the drawer, so
  // product-card.tsx and add-to-cart.tsx get the confirmation for free
  // without either component needing to know the drawer exists.
  isOpen: boolean;
  openCart(): void;
  closeCart(): void;
};

const CartContext = React.createContext<CartState | null>(null);
const storageKey = "greek-olive-fusion-cart";

/**
 * Decode the small set of HTML entities that can survive in feed-sourced copy
 * (e.g. WooCommerce short descriptions) so they render as real characters
 * instead of literal `&#8230;` / `&amp;`. The upstream feed cleaner already
 * handles some entities, but not all (notably the ellipsis), and double-encoding
 * can leave `&amp;#8230;` in the string — so we run named + numeric decoding,
 * twice, to unwind one level of double-escaping.
 */
export function decodeEntities(value: string): string {
  if (!value || value.indexOf("&") === -1) return value;

  const named: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&nbsp;": " "
  };

  const decodeOnce = (input: string) =>
    input
      // Numeric decimal entities, e.g. &#8230; -> …
      .replace(/&#(\d+);/g, (_, code: string) => {
        const point = Number.parseInt(code, 10);
        return Number.isFinite(point) ? String.fromCodePoint(point) : _;
      })
      // Numeric hex entities, e.g. &#x2026; -> …
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => {
        const point = Number.parseInt(code, 16);
        return Number.isFinite(point) ? String.fromCodePoint(point) : _;
      })
      // Named entities.
      .replace(/&[a-zA-Z]+;/g, (entity) => named[entity] ?? entity);

  // Decode twice to unwind one level of double-escaping (&amp;#8230; -> &#8230; -> …).
  return decodeOnce(decodeOnce(value));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<Array<{ product: StoreProduct; quantity: number }>>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

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

  const openCart = React.useCallback(() => setIsOpen(true), []);
  const closeCart = React.useCallback(() => setIsOpen(false), []);

  const addItem = React.useCallback(
    (product: StoreProduct, quantity = 1) => {
      setLines((current) => {
        const existing = current.find((line) => line.product.id === product.id);
        if (existing) {
          return current.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line
          );
        }

        return [...current, { product, quantity }];
      });
      // Pop the mini-cart on every add. Because this lives in the provider,
      // adds from product-card.tsx, add-to-cart.tsx, or anywhere else that
      // calls addItem all surface the confirmation drawer automatically.
      setIsOpen(true);
    },
    []
  );

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

    return {
      lines,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotalCents,
      isOpen,
      openCart,
      closeCart
    };
  }, [addItem, clearCart, closeCart, isOpen, lines, openCart, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider.");
  return context;
}
