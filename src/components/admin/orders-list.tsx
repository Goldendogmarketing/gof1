"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  email: string;
  customerName: string | null;
  status: "DRAFT" | "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
  totalCents: number;
  currency: string;
  itemCount: number;
  createdAt: string;
};

const DELETABLE_STATUSES = new Set<AdminOrderRow["status"]>(["DRAFT", "PENDING", "CANCELLED"]);

const STATUS_TONE: Record<AdminOrderRow["status"], string> = {
  DRAFT: "border-ink/20 text-ink/60",
  PENDING: "border-gold-400/40 text-gold-600",
  PAID: "border-olive-700/40 text-olive-700",
  FULFILLED: "border-olive-700/40 text-olive-900",
  CANCELLED: "border-terracotta/40 text-terracotta",
  REFUNDED: "border-terracotta/40 text-terracotta"
};

export function OrdersList({ orders }: { orders: AdminOrderRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | AdminOrderRow["status"]>("ALL");
  const [error, setError] = React.useState<string | null>(null);

  const visible = statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);

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
                <th className="py-3">Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id} className="border-t border-olive-900/10">
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
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteOrder(order)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
