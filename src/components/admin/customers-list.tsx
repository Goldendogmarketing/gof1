"use client";

import * as React from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminCustomerRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  marketingOptIn: boolean;
  orderCount: number;
  totalSpentCents: number;
  createdAt: string;
};

function formatAddress(c: AdminCustomerRow): string | null {
  if (!c.addressLine1 && !c.city) return null;
  const cityLine = [c.city, c.state, c.zip].filter(Boolean).join(", ").replace(/, (\d)/, " $1");
  return [c.addressLine1, c.addressLine2, cityLine].filter(Boolean).join(" · ");
}

export function CustomersList({ customers }: { customers: AdminCustomerRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (customers.length === 0) {
    return (
      <p className="text-sm leading-7 text-ink/65">
        No customers yet. They&rsquo;ll appear here automatically after the first checkout.
      </p>
    );
  }

  async function deleteCustomer(id: string, email: string) {
    if (!window.confirm(`Delete customer ${email}? Their historical orders will remain but will no longer be linked to a customer record.`)) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not delete customer.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete customer.");
    }
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p className="rounded-sm bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>
      ) : null}

      {customers.map((customer) =>
        editingId === customer.id ? (
          <CustomerEditCard
            key={customer.id}
            customer={customer}
            onCancel={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null);
              router.refresh();
            }}
          />
        ) : (
          <article
            key={customer.id}
            className="grid gap-3 rounded-sm border border-olive-900/10 bg-cream p-4 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div>
              <h2 className="font-semibold text-ink">
                {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email}
              </h2>
              <p className="mt-1 text-sm text-ink/60">{customer.email}</p>
              {customer.phone ? <p className="text-sm text-ink/60">{customer.phone}</p> : null}
              {formatAddress(customer) ? (
                <p className="mt-1 text-sm text-ink/60">{formatAddress(customer)}</p>
              ) : null}
              <p className="mt-1 text-xs text-ink/50">
                {customer.orderCount} {customer.orderCount === 1 ? "order" : "orders"}
                {" · "}
                ${(customer.totalSpentCents / 100).toFixed(2)} lifetime
                {customer.marketingOptIn ? " · marketing opt-in" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditingId(customer.id)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteCustomer(customer.id, customer.email)}
                title="Delete customer"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </article>
        )
      )}
    </div>
  );
}

function CustomerEditCard({
  customer,
  onCancel,
  onSaved
}: {
  customer: AdminCustomerRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = React.useState(customer.email);
  const [firstName, setFirstName] = React.useState(customer.firstName ?? "");
  const [lastName, setLastName] = React.useState(customer.lastName ?? "");
  const [phone, setPhone] = React.useState(customer.phone ?? "");
  const [addressLine1, setAddressLine1] = React.useState(customer.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = React.useState(customer.addressLine2 ?? "");
  const [city, setCity] = React.useState(customer.city ?? "");
  const [state, setState] = React.useState(customer.state ?? "");
  const [zip, setZip] = React.useState(customer.zip ?? "");
  const [marketingOptIn, setMarketingOptIn] = React.useState(customer.marketingOptIn);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          addressLine1: addressLine1 || null,
          addressLine2: addressLine2 || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          marketingOptIn
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not save customer.");
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-3 rounded-sm border border-olive-700/20 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">First name</span>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Last name</span>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
      </div>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Email</span>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Phone</span>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>

      <div className="mt-1 border-t border-olive-900/10 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Mailing address</p>
      </div>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Street address</span>
        <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} autoComplete="address-line1" />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Apt, suite, unit</span>
        <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} autoComplete="address-line2" />
      </label>
      <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr]">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">City</span>
          <Input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">State</span>
          <Input
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="FL"
            autoComplete="address-level1"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">ZIP</span>
          <Input value={zip} onChange={(e) => setZip(e.target.value)} autoComplete="postal-code" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-olive-900">
        <input
          type="checkbox"
          className="size-4 accent-olive-700"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
        />
        Marketing opt-in
      </label>
      {error ? <p className="text-sm text-terracotta">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          <X className="size-4" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          <Check className="size-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
