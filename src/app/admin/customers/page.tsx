import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasDatabaseUrl, prisma } from "@/lib/db";

export default async function AdminCustomersPage() {
  const customers = hasDatabaseUrl()
    ? await prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 50 }).catch(() => [])
    : [];

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Customers</p>
        <h1 className="font-display text-5xl text-ink">Customer Profiles</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer list</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length ? (
            <div className="grid gap-3">
              {customers.map((customer) => (
                <article key={customer.id} className="rounded-sm border border-olive-900/10 bg-cream p-4">
                  <h2 className="font-semibold text-ink">
                    {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email}
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">{customer.email}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-ink/65">
              Customer profiles are created from checkout email capture and historical orders once the database is connected.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
