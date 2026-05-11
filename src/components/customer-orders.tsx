import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

export async function CustomerOrders({ email }: { email: string }) {
  if (!hasDatabaseUrl()) {
    return (
      <EmptyState message="Order history will appear here once the storefront is connected to its database." />
    );
  }

  if (!email) {
    return <EmptyState message="No email on file." />;
  }

  const orders = await prisma.order
    .findMany({
      where: { email: email.toLowerCase() },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: true }
    })
    .catch(() => null);

  if (!orders) {
    return <EmptyState message="Order history is temporarily unavailable. Please try again in a moment." />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState message="No orders yet. Once you place one, it'll show up here for tracking and one-tap reordering." />
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <article key={order.id} className="rounded-md border border-olive-900/10 bg-white/60 p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-olive-700/75">
                Order {order.orderNumber}
              </p>
              <p className="mt-1 text-sm text-ink/65">
                {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })} · {order.status}
              </p>
            </div>
            <p className="font-display text-2xl text-olive-900">
              {formatMoney(order.totalCents, order.currency)}
            </p>
          </div>
          <ul className="mt-4 grid gap-1 text-sm text-ink/75">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity} × {item.title}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="secondary" size="sm">
              <Link href="/shop">
                <ShoppingBag className="size-4" />
                Reorder
              </Link>
            </Button>
          </div>
        </article>
      ))}
      <p className="mt-2 text-xs italic text-ink/50">Automatic reorders coming soon.</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-olive-900/15 bg-white/40 p-6 text-sm leading-7 text-ink/65">
      {message}
    </div>
  );
}
