import { Settings2, Truck, CreditCard, Mail, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder until we design a real settings system. The items below describe
// what we intend to make editable here — none of them are wired up yet.
const plannedSettings = [
  {
    icon: Truck,
    title: "Shipping rates",
    description:
      "Edit the per-bottle shipping rate and free-shipping threshold without a code change — and, later, manage the live FedEx rate integration."
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "View the connected Clover account and switch between sandbox and production from the dashboard."
  },
  {
    icon: Mail,
    title: "Email notifications",
    description:
      "Choose who receives order alerts (owner and fulfillment), set the from-address, and send test emails."
  },
  {
    icon: Store,
    title: "Store information",
    description: "Business name, mailing address, support email and phone — the details shown across the site and policies."
  }
] as const;

export default function AdminSettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Settings</p>
        <h1 className="font-display text-5xl text-ink">Store Configuration</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 rounded-sm border border-dashed border-olive-700/25 bg-cream/60 p-6 text-center sm:grid-cols-[auto_1fr] sm:text-left">
            <div className="grid place-items-center sm:place-items-start">
              <Settings2 className="size-10 text-olive-700/40" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl text-ink">A real settings panel is on the way</h3>
              <p className="text-sm leading-6 text-ink/65">
                For now, store configuration (shipping, payments, email, and business details) is managed through
                environment variables and code. This page is a placeholder until we design a proper settings experience
                you can edit yourself. Below is what we plan to put here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {plannedSettings.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-5 text-gold-600" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="inline-block rounded-full border border-olive-700/20 bg-white/60 px-2.5 py-0.5 text-xs font-semibold uppercase text-olive-700/70">
                  Planned
                </span>
                <p className="mt-2 text-sm leading-6 text-ink/60">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
