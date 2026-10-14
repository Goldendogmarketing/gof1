"use client";

import * as React from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Clock3, MinusCircle, RotateCw, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { EmailLog, EmailLogEntry } from "@/lib/order-emails";
import type { ShippingAddress } from "@/lib/validations";

export type AdminOrderItem = {
  id: string;
  title: string;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  email: string;
  customerName: string | null;
  status: "DRAFT" | "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  taxCents: number;
  currency: string;
  itemCount: number;
  items: AdminOrderItem[];
  shippingAddress: ShippingAddress | null;
  emailLog: EmailLog | null;
  isTest: boolean;
  createdAt: string;
};

const DELETABLE_STATUSES = new Set<AdminOrderRow["status"]>(["DRAFT", "PENDING", "CANCELLED"]);
const PAID_STATUSES = new Set<AdminOrderRow["status"]>(["PAID", "FULFILLED"]);

const STATUS_TONE: Record<AdminOrderRow["status"], string> = {
  DRAFT: "border-ink/20 text-ink/60",
  PENDING: "border-gold-400/40 text-gold-600",
  PAID: "border-olive-700/40 text-olive-700",
  FULFILLED: "border-olive-700/40 text-olive-900",
  CANCELLED: "border-terracotta/40 text-terracotta",
  REFUNDED: "border-terracotta/40 text-terracotta"
};

type DeliveryState = "sent" | "failed" | "skipped" | "pending" | "unrecorded";

const DELIVERY_TONE: Record<DeliveryState, string> = {
  sent: "border-olive-700/40 text-olive-700",
  failed: "border-terracotta/40 text-terracotta",
  skipped: "border-ink/20 text-ink/50",
  pending: "border-ink/20 text-ink/50",
  unrecorded: "border-gold-400/40 text-gold-600"
};

/** Where the Ariston fulfillment email stands for this order. */
function aristonState(order: AdminOrderRow): { state: DeliveryState; label: string } {
  if (order.isTest) return { state: "skipped", label: "Skipped (test)" };
  const entry = order.emailLog?.dropship;
  if (entry?.sent) return { state: "sent", label: "Sent" };
  if (entry && !entry.sent) return { state: "failed", label: "Failed" };
  if (PAID_STATUSES.has(order.status)) return { state: "unrecorded", label: "Not recorded" };
  return { state: "pending", label: "Awaits payment" };
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function OrdersList({ orders, focusId = null }: { orders: AdminOrderRow[]; focusId?: string | null }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | AdminOrderRow["status"]>("ALL");
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(focusId ? [focusId] : []));
  const [error, setError] = React.useState<string | null>(null);

  const visible = statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);

  // Scroll the focused order (from the owner email's "Open in admin" link) into view.
  React.useEffect(() => {
    if (!focusId) return;
    document.getElementById(`order-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusId]);

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteOrder(order: AdminOrderRow) {
    const deletable = DELETABLE_STATUSES.has(order.status);
    if (!deletable) {
      const force = window.confirm(
        `${order.orderNumber} is ${order.status} — it's an accounting record. Force delete anyway?`
      );
      if (!force) return;
    } else if (!window.confirm(`Delete order ${order.orderNumber}?`)) {
      return;
    }

    setError(null);
    try {
      const url = `/api/admin/orders/${order.id}${deletable ? "" : "?force=true"}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not delete order.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete order.");
    }
  }

  if (orders.length === 0) {
    return (
      <p className="text-sm leading-7 text-ink/65">
        No orders yet. They&rsquo;ll appear here automatically when customers check out.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive-700/70">Show:</span>
        {(["ALL", "DRAFT", "PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-sm border px-2.5 py-1 text-xs font-semibold transition ${
              statusFilter === s
                ? "border-olive-700 bg-olive-700 text-cream"
                : "border-olive-900/15 text-olive-900 hover:bg-olive-700/10"
            }`}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-sm bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-sm text-ink/60">No orders match &ldquo;{statusFilter}&rdquo;.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-olive-700">
              <tr>
                <th className="w-8 py-3" aria-label="Expand" />
                <th className="py-3">Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Ariston email</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => {
                const isOpen = expanded.has(order.id);
                const ariston = aristonState(order);
                return (
                  <React.Fragment key={order.id}>
                    <tr
                      id={`order-${order.id}`}
                      className={`cursor-pointer border-t border-olive-900/10 transition hover:bg-olive-700/5 ${
                        isOpen ? "bg-olive-700/5" : ""
                      }`}
                      onClick={() => toggle(order.id)}
                    >
                      <td className="py-3 text-olive-700">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Hide" : "Show"} details for ${order.orderNumber}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggle(order.id);
                          }}
                          className="grid place-items-center"
                        >
                          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                      <td className="py-3 font-semibold">{order.orderNumber}</td>
                      <td>
                        <div className="text-ink">{order.customerName ?? order.email}</div>
                        {order.customerName ? <div className="text-xs text-ink/50">{order.email}</div> : null}
                      </td>
                      <td>
                        <Badge className={STATUS_TONE[order.status]}>{order.status}</Badge>
                      </td>
                      <td>{order.itemCount}</td>
                      <td>{formatMoney(order.totalCents, order.currency)}</td>
                      <td>
                        <Badge className={DELIVERY_TONE[ariston.state]}>{ariston.label}</Badge>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteOrder(order);
                          }}
                          title={
                            DELETABLE_STATUSES.has(order.status)
                              ? "Delete order"
                              : "Paid/fulfilled — requires force confirmation"
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="bg-olive-700/5">
                        <td colSpan={9} className="px-3 pb-6 pt-1">
                          <OrderDetail order={order} />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderDetail({ order }: { order: AdminOrderRow }) {
  const address = order.shippingAddress;
  return (
    <div className="grid gap-6 rounded-md border border-olive-900/10 bg-white/80 p-5 lg:grid-cols-[1.6fr_1fr]">
      {/* Line items */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-olive-700/80">Items ordered</h3>
        {order.items.length === 0 ? (
          <p className="text-sm text-ink/60">No line items recorded on this order.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="py-2 font-semibold">Item</th>
                <th className="font-semibold">SKU</th>
                <th className="text-right font-semibold">Qty</th>
                <th className="text-right font-semibold">Unit</th>
                <th className="text-right font-semibold">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-olive-900/10">
                  <td className="py-2 pr-3 text-ink">{item.title}</td>
                  <td className="pr-3 font-mono text-xs text-ink/70">{item.sku ?? "—"}</td>
                  <td className="text-right font-semibold text-ink">{item.quantity}</td>
                  <td className="text-right text-ink/70">{formatMoney(item.unitPriceCents, order.currency)}</td>
                  <td className="text-right text-ink">{formatMoney(item.totalCents, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <dl className="ml-auto grid max-w-xs gap-1 border-t border-olive-900/10 pt-3 text-sm">
          <TotalRow label={`Subtotal (${order.itemCount} item${order.itemCount === 1 ? "" : "s"})`} cents={order.subtotalCents} currency={order.currency} />
          {order.discountCents > 0 ? (
            <TotalRow label="Discount" cents={-order.discountCents} currency={order.currency} />
          ) : null}
          <TotalRow
            label="Shipping"
            cents={order.shippingCents}
            currency={order.currency}
            freeLabel={order.shippingCents === 0 ? "Free" : undefined}
          />
          {order.taxCents > 0 ? <TotalRow label="Tax" cents={order.taxCents} currency={order.currency} /> : null}
          <TotalRow label="Total" cents={order.totalCents} currency={order.currency} bold />
        </dl>
      </div>

      {/* Ship-to + email confirmations */}
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-olive-700/80">Ship to</h3>
          {address ? (
            <address className="text-sm not-italic leading-6 text-ink/80">
              {address.firstName} {address.lastName}
              <br />
              {address.addressLine1}
              {address.addressLine2 ? (
                <>
                  , {address.addressLine2}
                </>
              ) : null}
              <br />
              {address.city}, {address.state} {address.zip}
              <br />
              {address.phone}
            </address>
          ) : (
            <p className="text-sm text-ink/60">No shipping address on file.</p>
          )}
        </div>

        <EmailConfirmations order={order} />
      </div>
    </div>
  );
}

function TotalRow({
  label,
  cents,
  currency,
  bold,
  freeLabel
}: {
  label: string;
  cents: number;
  currency: string;
  bold?: boolean;
  freeLabel?: string;
}) {
  return (
    <div className={`flex justify-between gap-6 ${bold ? "border-t border-olive-900/10 pt-1 font-semibold text-ink" : "text-ink/70"}`}>
      <dt>{label}</dt>
      <dd>{freeLabel ?? formatMoney(cents, currency)}</dd>
    </div>
  );
}

function EmailConfirmations({ order }: { order: AdminOrderRow }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);
  const ariston = aristonState(order);
  const canResend = !order.isTest && PAID_STATUSES.has(order.status);

  async function resend() {
    if (!window.confirm(`Send the fulfillment email for ${order.orderNumber} to Ariston Foods again?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/resend-dropship`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: body.error ?? "Resend failed." });
      } else {
        setMessage({ ok: true, text: "Sent to Ariston Foods." });
        router.refresh();
      }
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Resend failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-olive-700/80">Email confirmations</h3>

      {/* Ariston is called out first — it's the one that gets the order packed. */}
      <div
        className={`rounded-sm border p-3 ${
          ariston.state === "sent"
            ? "border-olive-700/30 bg-olive-700/5"
            : ariston.state === "failed"
            ? "border-terracotta/40 bg-terracotta/5"
            : ariston.state === "unrecorded"
            ? "border-gold-400/40 bg-gold-400/5"
            : "border-olive-900/10 bg-white/60"
        }`}
      >
        <EmailLine
          label="Ariston Foods (fulfillment)"
          entry={order.emailLog?.dropship}
          fallback={
            ariston.state === "skipped"
              ? "Not sent — test orders never go to Ariston."
              : ariston.state === "unrecorded"
              ? "Paid before delivery tracking was added, so no record exists. Use Resend if you're unsure Ariston has it."
              : "Sends automatically once the payment clears."
          }
          emphasize
        />
        {canResend ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" variant="secondary" onClick={resend} disabled={busy}>
              <RotateCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
              {busy ? "Sending…" : "Resend to Ariston"}
            </Button>
            {message ? (
              <span className={`text-xs font-semibold ${message.ok ? "text-olive-700" : "text-terracotta"}`}>
                {message.text}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        <EmailLine label="Customer receipt" entry={order.emailLog?.customer} fallback="Not sent yet." />
        <EmailLine label="Owner alert" entry={order.emailLog?.owner} fallback="Not sent yet." />
      </div>
    </div>
  );
}

function EmailLine({
  label,
  entry,
  fallback,
  emphasize
}: {
  label: string;
  entry?: EmailLogEntry;
  fallback: string;
  emphasize?: boolean;
}) {
  const skipped = entry && !entry.sent && entry.reason?.startsWith("skipped");
  const Icon = !entry ? Clock3 : entry.sent ? CheckCircle2 : skipped ? MinusCircle : XCircle;
  const tone = !entry ? "text-ink/40" : entry.sent ? "text-olive-700" : skipped ? "text-ink/40" : "text-terracotta";

  return (
    <div className="flex gap-2 text-sm">
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} />
      <div className="min-w-0">
        <div className={emphasize ? "font-semibold text-ink" : "text-ink"}>{label}</div>
        {!entry ? (
          <div className="text-xs text-ink/55">{fallback}</div>
        ) : entry.sent ? (
          <div className="text-xs text-ink/60">
            Sent {formatWhen(entry.at)}
            {entry.to ? <> to <span className="font-medium text-ink/80">{entry.to}</span></> : null}
            {entry.id ? <span className="block break-all font-mono text-[11px] text-ink/40">Message ID {entry.id}</span> : null}
          </div>
        ) : skipped ? (
          <div className="text-xs text-ink/55">Skipped — test order.</div>
        ) : (
          <div className="text-xs text-terracotta">
            Failed {formatWhen(entry.at)}
            {entry.reason ? <>: {entry.reason}</> : null}
          </div>
        )}
      </div>
    </div>
  );
}
