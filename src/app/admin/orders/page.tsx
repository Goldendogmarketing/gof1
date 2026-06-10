import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersList, type AdminOrderRow } from "@/components/admin/orders-list";
import { hasDatabaseUrl, prisma } from "@/lib/db";

// Always rebuild — order list changes whenever the admin deletes one.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const rows = hasDatabaseUrl()
    ? await prisma.order
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
          include: {
            customer: { select: { firstName: true, lastName: true } },
            _count: { select: { items: true } }
          }
        })
        .catch(() => [])
    : [];

  const orders: AdminOrderRow[] = rows.map((row) => {
    const customerName =
      row.customer && (row.customer.firstName || row.customer.lastName)
        ? [row.customer.firstName, row.customer.lastName].filter(Boolean).join(" ")
        : null;

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      email: row.email,
      customerName,
      status: row.status,
      totalCents: row.totalCents,
      currency: row.currency,
      itemCount: row._count.items,
      createdAt: row.createdAt.toISOString()
    };
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Orders</p>
        <h1 className="font-display text-5xl text-ink">Order Management</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Delete stale unprocessed orders (PENDING / DRAFT / CANCELLED) one-click. Paid and fulfilled orders require
          a force-confirmation since they&rsquo;re accounting records.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{orders.length} order{orders.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersList orders={orders} />
        </CardContent>
      </Card>
    </section>
  );
}
