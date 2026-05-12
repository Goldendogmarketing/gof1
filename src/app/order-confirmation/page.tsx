import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OrderConfirmationPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; demo?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 pt-28 lg:pt-[240px]">
      <section className="max-w-2xl rounded-md border border-olive-900/10 bg-white/60 p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto mb-5 size-12 text-olive-700" />
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Order confirmation</p>
        <h1 className="font-display text-5xl text-ink">Thank you for your order.</h1>
        <p className="mt-5 leading-8 text-ink/68">
          {params.demo
            ? "Demo checkout is enabled because Stripe keys are not configured yet."
            : "Your payment session is complete and the order will be reconciled by the Stripe webhook."}
        </p>
        {params.session_id ? <p className="mt-4 text-xs text-ink/45">Session: {params.session_id}</p> : null}
        <Button asChild className="mt-7">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </section>
    </main>
  );
}
