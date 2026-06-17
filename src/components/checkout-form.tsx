"use client";

import * as React from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";
import { calculateShippingCents } from "@/lib/shipping";
import { shippingAddressSchema } from "@/lib/validations";
import { SHIPPABLE_US_STATES } from "@/lib/us-states";

type FieldErrors = Partial<Record<
  "email" | "firstName" | "lastName" | "addressLine1" | "city" | "state" | "zip" | "phone",
  string
>>;

export function CheckoutForm() {
  const { lines, subtotalCents, itemCount } = useCart();
  const shippingCents = calculateShippingCents(subtotalCents, itemCount);
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [addressLine1, setAddressLine1] = React.useState("");
  const [addressLine2, setAddressLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [phone, setPhone] = React.useState("");
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
          <StateField value={state} onChange={setState} error={fieldErrors.state} />
          <Field label="ZIP" value={zip} onChange={setZip} error={fieldErrors.zip} placeholder="34950" autoComplete="postal-code" />
        </div>
        <Field label="Phone" value={phone} onChange={setPhone} error={fieldErrors.phone} placeholder="(772) 555-0123" autoComplete="tel" inputMode="tel" />
      </fieldset>

      <div className="rounded-sm bg-cream p-4 text-sm text-ink/70">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(subtotalCents)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span>Shipping</span>
          <span>{shippingCents > 0 ? formatMoney(shippingCents) : "Free"}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-olive-900/10 pt-2 font-semibold text-ink">
          <span>Total</span>
          <span>{formatMoney(subtotalCents + shippingCents)}</span>
        </div>
      </div>

      {formError ? <p className="text-sm font-semibold text-terracotta">{formError}</p> : null}
      <Button type="submit" size="lg" disabled={loading || !lines.length}>
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-5" />}
        Continue to secure checkout
      </Button>
      <p className="text-xs leading-5 text-ink/55">
        By placing your order, you agree to our{" "}
        <a href="/terms" className="underline hover:text-olive-700">Terms of Service</a>,{" "}
        <a href="/privacy" className="underline hover:text-olive-700">Privacy Policy</a>,{" "}
        <a href="/shipping" className="underline hover:text-olive-700">Shipping Policy</a>, and{" "}
        <a href="/returns" className="underline hover:text-olive-700">Returns &amp; Refunds</a>.
      </p>
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

// State dropdown limited to our shipping area (48 contiguous states + DC), so a
// shopper can't select a destination we don't ship to. Stores the 2-letter code.
function StateField(props: { value: string; onChange: (next: string) => void; error?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-olive-900">State</span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete="address-level1"
        aria-invalid={props.error ? true : undefined}
        className="h-11 w-full rounded-sm border border-olive-700/20 bg-white/75 px-3 text-sm text-ink outline-none transition focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
      >
        <option value="" disabled>
          Select…
        </option>
        {SHIPPABLE_US_STATES.map((s) => (
          <option key={s.code} value={s.code}>
            {s.code} — {s.name}
          </option>
        ))}
      </select>
      {props.error ? <span className="text-xs text-terracotta">{props.error}</span> : null}
    </label>
  );
}
