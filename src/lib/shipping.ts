// Shipping rules — single source of truth. Update here and every cart, checkout,
// admin view, and email picks it up automatically.

/** Orders at or above this PRODUCT subtotal (not counting shipping) ship free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 8500; // $85.00

/** Shipping charged for the first bottle in an order below the free threshold. */
export const FIRST_ITEM_SHIPPING_CENTS = 4040; // $40.40

/** Added to shipping for each additional bottle beyond the first. */
export const ADDITIONAL_ITEM_SHIPPING_CENTS = 110; // $1.10

/**
 * Returns the shipping fee in cents for a given cart.
 * - empty cart → $0 (don't show a phantom shipping line)
 * - product subtotal >= free-shipping threshold → $0
 * - otherwise → $40.40 for the first item + $1.10 for each additional item
 *
 * @param subtotalCents product subtotal in cents (excludes shipping)
 * @param itemCount total number of items (bottles) in the cart
 */
export function calculateShippingCents(subtotalCents: number, itemCount: number): number {
  if (subtotalCents <= 0 || itemCount <= 0) return 0;
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FIRST_ITEM_SHIPPING_CENTS + (itemCount - 1) * ADDITIONAL_ITEM_SHIPPING_CENTS;
}
