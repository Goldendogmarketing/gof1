import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersList, type AdminOrderRow } from "@/components/admin/orders-list";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { isTestOrder, type EmailLog } from "@/lib/order-emails";
import { shippingAddressSchema } from "@/lib/validations";

// Always rebuild — order list changes whenever the admin deletes one.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;

  const rows = hasDatabaseUrl()
    ? await prisma.order
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
          include: {
            customer: { select: { firstName: true, lastName: true } },
            items: { orderBy: { createdAt: "asc" } }
          }
        })
        .catch(() => [])
    : [];

  const orders: AdminOrderRow[] = rows.map((row) => {
    const customerName =
      row.customer && (row.customer.firstName || row.customer.lastName)
        ? [row.customer.firstName, row.customer.lastName].filter(Boolean).join(" ")
        : null;
    const address = shippingAddressSchema.safeParse(row.shippingAddress ?? {});

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      email: row.email,
      customerName,
      status: row.status,
      totalCents: row.totalCents,
      subtotalCents: row.subtotalCents,
      shippingCents: row.shippingCents,
      discountCents: row.discountCents,
      taxCents: row.taxCents,
      currency: row.currency,
      itemCount: row.items.reduce((total, item) => total + item.quantity, 0),
      items: row.items.map((item) => ({
        id: item.id,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.totalCents
      })),
      shippingAddress: address.success ? address.data : null,
      emailLog: (row.emailLog as EmailLog | null) ?? null,
      isTest: isTestOrder(row.orderNumber),
      createdAt: row.createdAt.toISOString()
    };
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Orders</p>
        <h1 className="font-display text-5xl text-ink">Order Management</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Click any order to see the full breakdown — items, SKUs, quantities, ship-to address — and whether the
          fulfillment email reached Ariston Foods. Unprocessed orders (PENDING / DRAFT / CANCELLED) can be deleted
          one-click; paid orders require a force confirmation since they&rsquo;re accounting records.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{orders.length} order{orders.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersList orders={orders} focusId={focus ?? null} />
        </CardContent>
      </Card>
    </section>
  );
}
