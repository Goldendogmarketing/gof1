import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { hasDatabaseUrl, prisma } from "@/lib/db";

export default async function AdminOrdersPage() {
  const orders = hasDatabaseUrl()
    ? await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 50 }).catch(() => [])
    : [];

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Orders</p>
        <h1 className="font-display text-5xl text-ink">Order Management</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-olive-700">
                  <tr>
                    <th className="py-3">Order</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-olive-900/10">
                      <td className="py-3 font-semibold">{order.orderNumber}</td>
                      <td>{order.email}</td>
                      <td>{order.status}</td>
                      <td>{formatMoney(order.totalCents, order.currency)}</td>
                      <td>{order.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm leading-7 text-ink/65">
              Orders will appear after Stripe webhook events or demo checkout persistence are connected to a database.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
