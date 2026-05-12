import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout — Coming soon"
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <div className="container py-12">
        <div className="mx-auto grid max-w-2xl gap-6 rounded-md border border-olive-900/10 bg-white/70 p-10 text-center shadow-soft backdrop-blur">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-gold-400/20 text-gold-600">
            <Sparkles className="size-7" />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">Checkout</p>
            <h1 className="mt-2 font-display text-5xl leading-tight text-ink sm:text-6xl">Coming soon</h1>
            <p className="mt-5 leading-8 text-ink/68">
              Online payments aren't live yet. We're finishing up secure card processing — in the meantime, you can
              still place an order over the phone.
            </p>
          </div>

          <div className="grid gap-3 rounded-md border border-olive-900/10 bg-cream/60 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-olive-700/80">To place an order</p>
            <p className="font-display text-2xl text-ink">Call Joe</p>
            <a
              href="tel:+17725285208"
              className="inline-flex items-center justify-center gap-2 font-display text-3xl text-olive-700 transition hover:text-olive-900"
            >
              <Phone className="size-6" />
              (772) 528-5208
            </a>
          </div>

          <Button asChild variant="secondary" className="mx-auto">
            <Link href="/cart">
              <ArrowLeft className="size-4" />
              Back to cart
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
