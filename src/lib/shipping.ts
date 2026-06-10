// Shipping rules — single source of truth. Update here and every cart, checkout,
// admin view, and email picks it up automatically.

/** Orders at or above this subtotal ship free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 8500; // $85.00

/** Flat shipping fee charged when the subtotal is below the free-shipping threshold. */
export const FLAT_SHIPPING_CENTS = 2700; // $27.00

/**
 * Returns the shipping fee in cents for a given cart subtotal.
 * - $0 subtotal → $0 (don't show a phantom shipping line on an empty cart)
 * - subtotal >= threshold → $0
 * - otherwise → flat fee
 */
export function calculateShippingCents(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FLAT_SHIPPING_CENTS;
}
