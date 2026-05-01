import type { Metadata } from "next";
import { CartPage } from "@/components/cart-page";

export const metadata: Metadata = {
  title: "Cart"
};

export default function Cart() {
  return (
    <main className="min-h-screen pt-28">
      <section className="container py-8">
        <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Cart</p>
        <h1 className="font-display text-5xl text-ink sm:text-6xl">Your Mediterranean basket</h1>
      </section>
      <CartPage />
    </main>
  );
}
