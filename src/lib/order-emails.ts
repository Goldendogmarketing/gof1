import type { Order, OrderItem, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  sendAllOrderEmails,
  sendDropshipOrderEmail,
  type OrderEmailPayload,
  type SendResult
} from "@/lib/email";
import { shippingAddressSchema, type ShippingAddress } from "@/lib/validations";

// Shared by the Clover webhook (first send on PAID) and the admin "resend to
// Ariston" action, so both build the same email and record results the same way.

export type EmailLogEntry = SendResult & { at: string };
export type EmailLog = {
  customer?: EmailLogEntry;
  owner?: EmailLogEntry;
  dropship?: EmailLogEntry;
};

type OrderWithItems = Order & { items: OrderItem[] };

/** Orders created by the admin $1 payment test never notify the fulfillment partner. */
export function isTestOrder(orderNumber: string) {
  return orderNumber.startsWith("TEST-");
}

function parseShippingAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = shippingAddressSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function buildAdminOrderUrl(orderId: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/admin/orders?focus=${encodeURIComponent(orderId)}`;
}

export function buildOrderEmailPayload(order: OrderWithItems): OrderEmailPayload {
  return {
    orderNumber: order.orderNumber,
    customerEmail: order.email,
    shippingAddress: parseShippingAddress(order.shippingAddress),
    lineItems: order.items.map((item) => ({
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currency: order.currency,
    adminUrl: buildAdminOrderUrl(order.id)
  };
}

function stamp(result: SendResult): EmailLogEntry {
  return { ...result, at: new Date().toISOString() };
}

async function saveEmailLog(orderId: string, log: EmailLog, dropshipSent: boolean) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        emailLog: log as unknown as Prisma.InputJsonValue,
        ...(dropshipSent ? { dropshipEmailSentAt: new Date() } : {})
      }
    });
  } catch (error) {
    // Never let bookkeeping failures bubble up into the webhook response.
    console.warn(`Could not record email results for order ${orderId}:`, error);
  }
}

/** Sends customer + owner + Ariston emails for a paid order and records each outcome. */
export async function sendAndRecordOrderEmails(order: OrderWithItems) {
  const results = await sendAllOrderEmails(buildOrderEmailPayload(order), {
    skipDropship: isTestOrder(order.orderNumber)
  });
  await saveEmailLog(
    order.id,
    { customer: stamp(results.customer), owner: stamp(results.owner), dropship: stamp(results.dropship) },
    results.dropship.sent
  );
  return results;
}

/** Re-sends only the Ariston fulfillment email and updates its entry in the log. */
export async function resendDropshipEmail(order: OrderWithItems) {
  const result: SendResult = await sendDropshipOrderEmail(buildOrderEmailPayload(order)).catch((err) => ({
    sent: false,
    reason: String(err)
  }));
  const existing = (order.emailLog ?? {}) as EmailLog;
  await saveEmailLog(order.id, { ...existing, dropship: stamp(result) }, result.sent);
  return result;
}
