import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasDatabaseUrl } from "@/lib/db";

const checks = [
  ["Database", () => hasDatabaseUrl(), "Vercel Postgres or Neon connection string"],
  ["Stripe", () => Boolean(process.env.STRIPE_SECRET_KEY), "Checkout and webhook keys"],
  ["Resend", () => Boolean(process.env.RESEND_API_KEY), "Transactional email"],
  [
    "Product feed",
    () => Boolean(process.env.PRODUCT_FEED_URL || process.env.WOOCOMMERCE_STORE_URL),
    "External catalog API"
  ],
  ["Cron secret", () => Boolean(process.env.CRON_SECRET), "Scheduled sync protection"],
  ["Blob token", () => Boolean(process.env.BLOB_READ_WRITE_TOKEN), "Media uploads"]
] as const;

export default function AdminSettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Settings</p>
        <h1 className="font-display text-5xl text-ink">Store Configuration</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {checks.map(([label, getReady, description]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className={getReady() ? "font-semibold text-olive-700" : "font-semibold text-terracotta"}>
                {getReady() ? "Ready" : "Needs configuration"}
              </span>
              <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>SEO and publishing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-ink/65">
          Products, categories, homepage sections, and journey scenes include publish status and SEO fields in the
          Prisma schema, ready to expose in richer admin forms.
        </CardContent>
      </Card>
    </section>
  );
}
