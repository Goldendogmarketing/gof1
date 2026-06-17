import type { Metadata } from "next";
import { TestPurchaseClient } from "@/components/test-purchase-client";

// Hidden utility page — not linked anywhere and kept out of search indexes.
export const metadata: Metadata = {
  title: "Live payment test",
  robots: { index: false, follow: false }
};

export default function TestPurchasePage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 pt-28 lg:pt-[200px]">
      <section className="w-full max-w-md rounded-md border border-olive-900/10 bg-white/60 p-8 shadow-soft">
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Internal</p>
        <h1 className="font-display text-3xl text-ink">$1 Clover live test</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Runs a real $1.00 charge through Clover Hosted Checkout to confirm payments land in the merchant account and
          the order flow completes. No shipping is charged, and the fulfillment partner is <strong>not</strong> notified.
          Use a real card — you can refund the $1 in your Clover dashboard afterward.
        </p>
        <TestPurchaseClient />
      </section>
    </main>
  );
}
