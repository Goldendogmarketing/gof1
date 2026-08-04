import { TestPurchaseClient } from "@/components/test-purchase-client";

// Lives under /admin so it inherits the admin auth gate in src/app/admin/layout.tsx.
export const metadata = {
  title: "Live payment test",
  robots: { index: false, follow: false }
};

export default function AdminTestPurchasePage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Internal tools</p>
        <h1 className="font-display text-5xl text-ink">$1 Clover live test</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">
          Runs a real $1.00 charge through Clover Hosted Checkout to confirm payments land in the merchant
          account and the order flow completes end to end. No shipping is charged, and the fulfillment partner
          (Ariston) is <strong>not</strong> notified. Use a real card — refund the $1 from your Clover dashboard
          afterward, and delete the resulting <code className="font-mono">TEST-</code> order from Orders.
        </p>
      </div>
      <div className="max-w-md rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft">
        <TestPurchaseClient />
      </div>
    </section>
  );
}
