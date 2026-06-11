"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  initial: boolean;
};

export function FeaturedToggle({ productId, initial }: Props) {
  const router = useRouter();
  // Optimistic local state so the checkbox flips instantly while the PATCH
  // is in flight. We reconcile to `initial` on every prop change (which
  // happens after router.refresh() finishes).
  const [checked, setChecked] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setChecked(initial);
  }, [initial]);

  async function toggle(next: boolean) {
    setChecked(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: next })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not update.");
        setChecked(!next);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
      setChecked(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-olive-700/15 bg-white/65 px-3 py-1 text-xs font-semibold uppercase text-olive-700 transition hover:bg-white"
      title="Include this product in the homepage featured rotation"
    >
      <input
        type="checkbox"
        className="size-3.5 accent-olive-700"
        checked={checked}
        disabled={saving}
        onChange={(event) => toggle(event.target.checked)}
        aria-label="Feature this product on the homepage"
      />
      Featured
      {error ? <span className="text-[10px] font-normal text-terracotta">!</span> : null}
    </label>
  );
}
