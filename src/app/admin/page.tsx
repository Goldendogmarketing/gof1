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
          <CardTitle>Launch readiness</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-ink/70 md:grid-cols-2">
          <p>Database: {dbReady ? "connected" : "demo fallback"}</p>
          <p>Stripe: {process.env.STRIPE_SECRET_KEY ? "configured" : "pending"}</p>
          <p>Resend: {process.env.RESEND_API_KEY ? "configured" : "pending"}</p>
          <p>Product feed: {process.env.PRODUCT_FEED_URL ? "external feed" : "demo adapter"}</p>
        </CardContent>
      </Card>
    </section>
  );
}
