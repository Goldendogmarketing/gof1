import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomersList, type AdminCustomerRow } from "@/components/admin/customers-list";
import { hasDatabaseUrl, prisma } from "@/lib/db";

// Always rebuild — customer list changes whenever the admin edits or deletes.
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const rows = hasDatabaseUrl()
    ? await prisma.customer
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            _count: { select: { orders: true } },
            orders: { select: { totalCents: true, status: true } }
          }
        })
        .catch(() => [])
    : [];

  const customers: AdminCustomerRow[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    marketingOptIn: row.marketingOptIn,
    orderCount: row._count.orders,
    totalSpentCents: row.orders
      .filter((o) => o.status === "PAID" || o.status === "FULFILLED")
      .reduce((sum, o) => sum + o.totalCents, 0),
    createdAt: row.createdAt.toISOString()
  }));

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Customers</p>
        <h1 className="font-display text-5xl text-ink">Customer Profiles</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Edit contact details or remove a customer who requests to be deleted. Their historical orders are kept
          (decoupled from the customer record) so accounting is preserved.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{customers.length} customer{customers.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersList customers={customers} />
        </CardContent>
      </Card>
    </section>
  );
}
