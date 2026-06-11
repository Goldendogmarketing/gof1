import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { getProducts } from "@/lib/products";
import { formatMoney } from "@/lib/format";

export default async function AdminDashboardPage() {
  const products = await getProducts();
  const dbReady = hasDatabaseUrl();
  const [orders, customers] = dbReady
    ? await Promise.all([
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.customer.count()
      ]).catch(() => [[], 0] as const)
    : [[], 0] as const;
  const revenueCents = orders.reduce((total, order) => total + order.totalCents, 0);

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Owner dashboard</p>
        <h1 className="font-display text-5xl text-ink">Greek Olive Fusion Admin</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl text-olive-900">{products.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl text-olive-900">{orders.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl text-olive-900">{formatMoney(revenueCents)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl text-olive-900">{customers}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 rounded-sm border border-dashed border-olive-700/25 bg-cream/60 p-6 text-center sm:grid-cols-[auto_1fr] sm:text-left">
            <div className="grid place-items-center sm:place-items-start">
              <BarChart3 className="size-10 text-olive-700/40" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl text-ink">Analytics coming soon</h3>
              <p className="text-sm leading-6 text-ink/65">
                Site analytics will appear here once we decide what we want to track &mdash; typical options include
                traffic by page, conversion funnel (cart &rarr; checkout &rarr; paid), top products, traffic sources,
                and revenue trends. Tell me which of these matter most and I&rsquo;ll wire it up.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
