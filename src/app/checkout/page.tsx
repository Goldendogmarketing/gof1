import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout"
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
            finish your order. Flat $27 shipping on orders under $85 — free on $85 and up.
          </p>
        </section>
        <CheckoutForm />
      </div>
    </main>
  );
}
