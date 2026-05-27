"use client";

import * as React from "react";
import { RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";

type Props = {
  productId: string;
  currency: string;
  priceCents: number;
  compareAtCents?: number | null;
  // From the upstream feed snapshot — only present for DB-backed products that have been synced.
  feedPriceCents?: number | null;
  feedCompareAtCents?: number | null;
  priceOverridden?: boolean;
};

function centsToDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return Math.round(parsed * 100);
}

export function PriceEditor({
  productId,
  currency,
  priceCents,
  compareAtCents,
  feedPriceCents,
  feedCompareAtCents,
  priceOverridden
}: Props) {
  const router = useRouter();
  const [price, setPrice] = React.useState(centsToDollars(priceCents));
  const [compareAt, setCompareAt] = React.useState(centsToDollars(compareAtCents));
  const [state, setState] = React.useState<"idle" | "saving" | "resetting">("idle");
  const [error, setError] = React.useState<string | null>(null);
  // Note: the parent passes a `key` derived from the current price/override state, so this
  // component remounts (and re-initializes the inputs) whenever the saved price changes —
  // no prop-sync effect needed.

  const hasFeedPrice = feedPriceCents !== null && feedPriceCents !== undefined;
  const differsFromFeed =
    hasFeedPrice && feedPriceCents !== priceCents;

  async function saveOverride() {
    setError(null);
    const priceCentsValue = dollarsToCents(price);
    if (priceCentsValue === null || Number.isNaN(priceCentsValue) || priceCentsValue <= 0) {
      setError("Enter a valid price.");
      return;
    }
    const compareAtCentsValue = dollarsToCents(compareAt);
    if (compareAtCentsValue !== null && (Number.isNaN(compareAtCentsValue) || compareAtCentsValue <= 0)) {
      setError("Enter a valid compare-at price or leave it blank.");
      return;
    }

    setState("saving");
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override",
          priceCents: priceCentsValue,
          compareAtCents: compareAtCentsValue
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save price.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save price.");
    } finally {
      setState("idle");
    }
  }

  async function resetToFeed() {
    setError(null);
    setState("resetting");
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not reset price.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset price.");
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="grid w-full max-w-xs gap-2 text-right">
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <span className="text-xs font-semibold uppercase text-olive-700/70">Price</span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2 grid place-items-center text-xs text-olive-700/60">$</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="pl-5 text-right"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            disabled={state !== "idle"}
            aria-label="Override price (dollars)"
          />
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <span className="text-xs font-semibold uppercase text-olive-700/70">MSRP</span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2 grid place-items-center text-xs text-olive-700/60">$</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="Optional"
            className="pl-5 text-right"
            value={compareAt}
            onChange={(event) => setCompareAt(event.target.value)}
            disabled={state !== "idle"}
            aria-label="Compare-at MSRP (dollars)"
          />
        </div>
      </div>

      {hasFeedPrice ? (
        <p className="text-[11px] text-ink/50">
          Feed price: {formatMoney(feedPriceCents!, currency)}
          {feedCompareAtCents ? ` · MSRP ${formatMoney(feedCompareAtCents, currency)}` : ""}
          {priceOverridden ? " · override active" : differsFromFeed ? " · differs from feed" : ""}
        </p>
      ) : null}

      {error ? <p className="text-[11px] text-terracotta">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        {priceOverridden ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToFeed}
            disabled={state !== "idle"}
            title="Drop override and use the latest feed price"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={saveOverride} disabled={state !== "idle"}>
          <Save className="size-3.5" />
          {state === "saving" ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
