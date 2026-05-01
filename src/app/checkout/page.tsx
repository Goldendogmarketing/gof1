import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout"
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen pt-28">
      <div className="container grid gap-8 py-12 lg:grid-cols-[0.8fr_1fr]">
        <section>
          <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Checkout</p>
          <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">Secure checkout for your table.</h1>
          <p className="mt-5 max-w-xl leading-8 text-ink/68">
            Enter your email, apply a code if you have one, and we will calculate shipping and taxes before payment.
          </p>
        </section>
        <CheckoutForm />
      </div>
    </main>
  );
}
