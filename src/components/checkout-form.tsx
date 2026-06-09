"use client";

import * as React from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";
import { shippingAddressSchema } from "@/lib/validations";

type FieldErrors = Partial<Record<
  "email" | "firstName" | "lastName" | "addressLine1" | "city" | "state" | "zip" | "phone",
  string
>>;

export function CheckoutForm() {
  const { lines, subtotalCents } = useCart();
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [addressLine1, setAddressLine1] = React.useState("");
  const [addressLine2, setAddressLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [discountCode, setDiscountCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    // Validate the shipping address client-side first so users see field-level errors.
    const parsed = shippingAddressSchema.safeParse({
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
      phone
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          discountCode,
          shippingAddress: parsed.data,
          items: lines.map((line) => ({
            productId: line.product.id,
            slug: line.product.slug,
            quantity: line.quantity
          }))
        })
      });

      const body = await response.json();

      if (!response.ok) {
        setFormError(body.error ?? "Checkout could not be started.");
        setLoading(false);
        return;
      }

      window.location.href = body.url;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft">
      {/* Contact */}
      <fieldset className="grid gap-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Contact</legend>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-olive-900">Email</span>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
      </fieldset>

      {/* Shipping address */}
      <fieldset className="grid gap-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Shipping address</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name" value={firstName} onChange={setFirstName} error={fieldErrors.firstName} autoComplete="given-name" />
          <Field label="Last name" value={lastName} onChange={setLastName} error={fieldErrors.lastName} autoComplete="family-name" />
        </div>
        <Field label="Street address" value={addressLine1} onChange={setAddressLine1} error={fieldErrors.addressLine1} autoComplete="address-line1" />
        <Field label="Apt, suite, unit (optional)" value={addressLine2} onChange={setAddressLine2} autoComplete="address-line2" />
        <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr]">
          <Field label="City" value={city} onChange={setCity} error={fieldErrors.city} autoComplete="address-level2" />
          <Field label="State" value={state} onChange={(v) => setState(v.toUpperCase())} error={fieldErrors.state} placeholder="FL" maxLength={2} autoComplete="address-level1" />
          <Field label="ZIP" value={zip} onChange={setZip} error={fieldErrors.zip} placeholder="34950" autoComplete="postal-code" />
        </div>
        <Field label="Phone" value={phone} onChange={setPhone} error={fieldErrors.phone} placeholder="(772) 555-0123" autoComplete="tel" inputMode="tel" />
      </fieldset>

      {/* Discount + summary */}
      <fieldset className="grid gap-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Discount</legend>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-olive-900">Discount code</span>
          <Input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="TABLE10" autoComplete="off" />
        </label>
      </fieldset>

      <div className="rounded-sm bg-cream p-4 text-sm text-ink/70">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(subtotalCents)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span>Shipping and tax</span>
          <span>Calculated at checkout</span>
        </div>
      </div>

      {formError ? <p className="text-sm font-semibold text-terracotta">{formError}</p> : null}
      <Button type="submit" size="lg" disabled={loading || !lines.length}>
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-5" />}
        Continue to secure checkout
      </Button>
    </form>
  );
}

// Small wrapper for label + Input + inline error — keeps the form readable.
function Field(props: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-olive-900">{props.label}</span>
      <Input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        aria-invalid={props.error ? true : undefined}
      />
      {props.error ? <span className="text-xs text-terracotta">{props.error}</span> : null}
    </label>
  );
}
