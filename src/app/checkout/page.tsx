import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <div className="container grid gap-8 py-12 lg:grid-cols-[0.8fr_1fr]">
        <section>
          <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Checkout</p>
          <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">Secure checkout for your table.</h1>
          <p className="mt-5 max-w-xl leading-8 text-ink/68">
            Enter your contact and shipping details, and we&apos;ll continue to Clover&apos;s secure payment page to
            finish your order. Shipping starts at $40.40 for the first bottle plus $1.10 per additional bottle — free
            once your product subtotal reaches $85.
          </p>
        </section>
        <CheckoutForm />
      </div>
    </main>
  );
}
