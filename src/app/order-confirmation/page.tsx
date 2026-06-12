import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { shippingAddressSchema, type ShippingAddress } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmation — Greek Olive Fusion",
  description: "Thank you for your order. Your receipt is on the way."
};

type Search = {
  orderNumber?: string;
  orderId?: string;
  transactionId?: string;
  demo?: string;
};

type OrderRecord = Awaited<ReturnType<typeof loadOrder>>;

async function loadOrder(orderNumber: string | undefined) {
  if (!orderNumber || !hasDatabaseUrl()) return null;
  try {
    return await prisma.order.findFirst({
      where: { orderNumber },
      include: { items: true }
    });
  } catch (error) {
    console.warn("Could not load order for confirmation page:", error);
    return null;
  }
}

function parseAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = shippingAddressSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export default async function OrderConfirmationPage({
  searchParams
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const order = await loadOrder(params.orderNumber);
  const isPaid = order?.status === "PAID";
  const address = parseAddress(order?.shippingAddress);

  return (
    <main className="px-5 pb-24 pt-28 lg:pt-[200px]">
      <section className="mx-auto max-w-3xl space-y-8">
        <header className="rounded-md border border-olive-900/10 bg-white/60 p-8 text-center shadow-soft">
          {isPaid ? (
            <CheckCircle2 className="mx-auto mb-5 size-12 text-olive-700" />
          ) : (
            <Clock3 className="mx-auto mb-5 size-12 text-gold-600" />
          )}
          <p className="mb-3 text-sm font-semibold uppercase text-gold-600">
            {isPaid ? "Order confirmed" : "Order received"}
          </p>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">Thank you for your order.</h1>
          <p className="mt-5 leading-8 text-ink/68">
            {params.demo
              ? "Demo checkout is enabled because payments are not yet configured."
              : isPaid
              ? `Your payment has been received. We just sent a receipt to ${order?.email ?? "your email"}, and our fulfillment partner has been notified. You'll receive tracking once the order ships.`
              : "We have your order. As soon as your payment is confirmed by our processor (usually within a minute), we'll email your receipt and start fulfillment. You can safely close this tab — the email will arrive either way."}
          </p>
          {order ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink/60">
              <span>Order #<span className="font-semibold text-ink">{order.orderNumber}</span></span>
              <span>
                Status: <span className={`font-semibold ${isPaid ? "text-olive-700" : "text-gold-600"}`}>{order.status}</span>
              </span>
            </div>
          ) : params.orderNumber ? (
            <p className="mt-4 text-sm text-ink/55">
              Order number: <span className="font-semibold text-ink">{params.orderNumber}</span>
            </p>
          ) : null}
          {params.transactionId ? (
            <p className="mt-1 text-xs text-ink/45">Transaction reference: {params.transactionId}</p>
          ) : null}
        </header>

        {order ? <OrderReceipt order={order} address={address} /> : null}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
          {order ? (
            <Button asChild variant="ghost">
              <Link href="/account">View order history</Link>
            </Button>
          ) : null}
        </div>

        <p className="text-center text-xs text-ink/50">
          Need help? Email <a href="mailto:support@greekolivefusion.com" className="underline">support@greekolivefusion.com</a>
          {" "}or call (772) 528-5208.
        </p>
      </section>
    </main>
  );
}

function OrderReceipt({
  order,
  address
}: {
  order: NonNullable<OrderRecord>;
  address: ShippingAddress | null;
}) {
  return (
    <article className="space-y-6 rounded-md border border-olive-900/10 bg-white/60 p-8 shadow-soft">
      <div>
        <h2 className="font-display text-2xl text-ink">Receipt</h2>
        <ul className="mt-4 divide-y divide-olive-900/10 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 py-3">
              <span className="text-ink">
                <span className="font-semibold">{item.quantity}×</span> {item.title}
              </span>
              <span className="font-mono text-ink/70">{formatMoney(item.totalCents, order.currency)}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="space-y-1 border-t border-olive-900/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/60">Subtotal</dt>
          <dd className="font-mono text-ink">{formatMoney(order.subtotalCents, order.currency)}</dd>
        </div>
        {order.discountCents > 0 ? (
          <div className="flex justify-between">
            <dt className="text-ink/60">Discount</dt>
            <dd className="font-mono text-ink">-{formatMoney(order.discountCents, order.currency)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-ink/60">Shipping</dt>
          <dd className="font-mono text-ink">
            {order.shippingCents > 0 ? formatMoney(order.shippingCents, order.currency) : "Free"}
          </dd>
        </div>
        {order.taxCents > 0 ? (
          <div className="flex justify-between">
            <dt className="text-ink/60">Tax</dt>
            <dd className="font-mono text-ink">{formatMoney(order.taxCents, order.currency)}</dd>
          </div>
        ) : null}
        <div className="mt-2 flex justify-between border-t border-olive-900/10 pt-3 text-base">
          <dt className="font-display text-ink">Total</dt>
          <dd className="font-mono font-semibold text-ink">{formatMoney(order.totalCents, order.currency)}</dd>
        </div>
      </dl>

      {address ? (
        <div className="border-t border-olive-900/10 pt-4 text-sm">
          <h3 className="mb-2 font-semibold text-ink">Shipping to</h3>
          <address className="not-italic leading-6 text-ink/75">
            {address.firstName} {address.lastName}<br />
            {address.addressLine1}{address.addressLine2 ? <>, {address.addressLine2}</> : null}<br />
            {address.city}, {address.state} {address.zip}<br />
            {address.phone}
          </address>
        </div>
      ) : null}
    </article>
  );
}
