"use client";

import { formatMoney } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { cn } from "@/lib/utils";

/**
 * Free-shipping progress nudge. Reuses FREE_SHIPPING_THRESHOLD_CENTS from
 * lib/shipping — the same constant calculateShippingCents uses — so the "you're
 * $X away" message can never drift from what the order summary actually charges.
 */
export function FreeShippingBar({
  subtotalCents,
  className
}: {
  subtotalCents: number;
  className?: string;
}) {
  const unlocked = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const remainingCents = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const progress = Math.min(100, Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-ink/80" aria-live="polite">
        {unlocked ? (
          <span className="font-semibold text-olive-700">You&apos;ve unlocked free shipping 🎉</span>
        ) : (
          <>
            You&apos;re <span className="font-semibold text-olive-700">{formatMoney(remainingCents)}</span> from free
            shipping
          </>
        )}
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-olive-900/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progress toward free shipping"
      >
        <div
          className="h-full rounded-full bg-gold-400 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
