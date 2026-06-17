"use client";

import * as React from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TestPurchaseClient() {
  const [email, setEmail] = React.useState("orders@greekolivefusion.com");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/test-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        setError(body.error ?? "Could not start the test checkout.");
        setLoading(false);
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the test checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-olive-900">Receipt email</span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <span className="text-xs text-ink/50">
          The customer receipt + owner alert go here. Defaults to the store inbox.
        </span>
      </label>
      {error ? <p className="text-sm font-semibold text-terracotta">{error}</p> : null}
      <Button onClick={start} size="lg" disabled={loading}>
        {loading ? <Loader2 className="size-5 animate-spin" /> : <CreditCard className="size-5" />}
        {loading ? "Starting…" : "Pay $1 with Clover"}
      </Button>
    </div>
  );
}
