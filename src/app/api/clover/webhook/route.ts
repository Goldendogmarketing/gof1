import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { verifyCloverWebhookSignature } from "@/lib/clover";
import { sendAllOrderEmails, type OrderEmailPayload } from "@/lib/email";
import { shippingAddressSchema, type ShippingAddress } from "@/lib/validations";

// Clover webhooks must be processed with the raw body (the signature is computed over it),
// so we force the Node runtime — Edge gets a different request body API.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clover Hosted Checkout webhook receiver.
 *
 * Header: `Clover-Signature: t=<ts>,v1=<hex-hmac-sha256>`
 * Signing secret: Clover Merchant Dashboard → Settings → Ecommerce → Hosted Checkout (CLOVER_WEBHOOK_SIGNATURE_KEY).
 *
 * Events we care about today:
 *   - PAYMENT_SUCCESSFUL (or `status: "APPROVED"`) → mark the order PAID
 *   - PAYMENT_FAILED     (or `status: "DECLINED"`) → mark the order CANCELLED
 *
 * The payment is correlated to an existing order via the Clover `checkoutSessionId`,
 * which we persist into Order.stripeCheckoutSessionId at checkout-creation time.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("clover-signature");

  // Fail-closed in production: a missing signing secret means anyone can POST
  // forged "PAID" events, which would dispatch receipts and fulfillment emails.
  const secret = process.env.CLOVER_WEBHOOK_SIGNATURE_KEY;
  if (process.env.NODE_ENV === "production" && !secret) {
    console.error("Clover webhook rejected: CLOVER_WEBHOOK_SIGNATURE_KEY is not configured.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  if (secret) {
    const verified = verifyCloverWebhookSignature(rawBody, signature, secret);
    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: Record<string, unknown> = {};
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Clover wraps event details under `data` (sometimes `Data`). Unwrap that first,
  // then look for the fields we care about. The previous flat lookup pulled the
  // entire data object back and stringified it to "[object Object]", so no order
  // ever matched and PAID transitions silently never fired.
  const dataObject =
    (isObject(event.data) && (event.data as Record<string, unknown>)) ||
    (isObject(event.Data) && (event.Data as Record<string, unknown>)) ||
    event;

  const type = String(
    pickField(event, ["type", "Type", "eventType"]) ??
      pickField(dataObject, ["type", "Type", "eventType"]) ??
      ""
  ).toUpperCase();
  const status = String(
    pickField(event, ["status", "Status"]) ??
      pickField(dataObject, ["status", "Status"]) ??
      ""
  ).toUpperCase();
  const checkoutSessionId = String(
    pickField(dataObject, ["checkoutSessionId", "CheckoutSessionId", "checkoutSessionID"]) ??
      pickField(event, ["checkoutSessionId", "CheckoutSessionId", "checkoutSessionID"]) ??
      ""
  );
  // Clover reports the captured amount in integer cents (same unit as our
  // totalCents). It can surface under a few key names depending on the event
  // shape; null when absent so we can refuse to mark PAID without a verifiable
  // amount rather than trusting the event blindly.
  const paidCents = parseAmountCents(
    pickField(dataObject, ["amount", "Amount", "amountMoney", "total", "Total"]) ??
      pickField(event, ["amount", "Amount", "amountMoney", "total", "Total"])
  );

  // Log everything once on prod — invaluable the first time Clover sends a
  // real-money event. Strips noisy keys but keeps shape and ids for diagnosis.
  console.info("Clover webhook received:", {
    type,
    status,
    checkoutSessionId,
    eventKeys: Object.keys(event),
    dataKeys: isObject(dataObject) ? Object.keys(dataObject) : []
  });

  const isPaymentEvent = type === "PAYMENT" || type.startsWith("PAYMENT_") || type.startsWith("PAYMENT.");
  if (!isPaymentEvent || !checkoutSessionId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const isSuccess =
    status === "APPROVED" ||
    status === "SUCCESSFUL" ||
    type === "PAYMENT_SUCCESSFUL" ||
    type === "PAYMENT.SUCCESSFUL";
  const isFailure =
    status === "DECLINED" ||
    status === "FAILED" ||
    type === "PAYMENT_FAILED" ||
    type === "PAYMENT.FAILED";

  if (!hasDatabaseUrl()) {
    // No DB to update — acknowledge so Clover doesn't retry forever.
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    // We persist the Clover checkoutSessionId into stripeCheckoutSessionId at
    // checkout-create time so this lookup keeps a single "external session id" column.
    const order = await prisma.order.findFirst({
      where: { stripeCheckoutSessionId: checkoutSessionId },
      include: { items: true }
    });

    if (!order) {
      // We could not find a matching order. There are two cases:
      //  (a) Race: the checkout API persisted the Order row but had not yet
      //      written the Clover checkoutSessionId onto it when Clover fired
      //      the first webhook. Returning 503 prompts Clover to retry — by the
      //      time the retry lands the session id has been stored.
      //  (b) The order was never persisted (e.g. DATABASE_URL was missing at
      //      checkout time). Retries will all miss; Clover will give up after
      //      its retry budget. We accept that as a logged outcome rather than
      //      silently ack 200 and lose visibility into real-money mismatches.
      console.warn(
        `Clover webhook: no order found for checkoutSessionId=${checkoutSessionId}. Returning 503 to trigger Clover retry.`
      );
      return NextResponse.json(
        { error: "Order not yet available, retry shortly", checkoutSessionId },
        { status: 503 }
      );
    }

    if (isSuccess) {
      // Verify the captured amount matches the order total before flipping to
      // PAID. paidCents and totalCents are both integer cents. A null amount
      // (event omitted it) or a mismatch (partial capture, currency mix-up,
      // tampering) must not silently mark the order paid or dispatch receipts.
      if (paidCents === null) {
        console.warn(
          `Clover webhook: no paid amount on event for order ${order.orderNumber} (checkoutSessionId=${checkoutSessionId}); not marking PAID.`
        );
        return NextResponse.json({ ok: true, ignored: true, reason: "missing_amount" });
      }
      if (paidCents !== order.totalCents) {
        console.warn(
          `Clover webhook: paid amount ${paidCents} does not match order ${order.orderNumber} total ${order.totalCents}; not marking PAID.`
        );
        return NextResponse.json({ ok: true, ignored: true, reason: "amount_mismatch" });
      }

      // Atomic conditional transition: only the delivery that actually flips the
      // row from non-PAID to PAID gets count === 1. Concurrent/retried Clover
      // deliveries see count === 0 and skip the emails, so receipts go out once.
      const updated = await prisma.order.updateMany({
        where: { id: order.id, status: { not: "PAID" } },
        data: { status: "PAID" }
      });
      if (updated.count === 1) {
        // Build the email payload from the now-PAID order. We coerce shippingAddress
        // through the zod schema so older orders missing fields don't crash the render.
        const shippingAddress = parseShippingAddress(order.shippingAddress);
        const payload: OrderEmailPayload = {
          orderNumber: order.orderNumber,
          customerEmail: order.email,
          shippingAddress,
          lineItems: order.items.map((item) => ({
            title: item.title,
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

        // Fire-and-don't-fail: log per-email result, never propagate to Clover.
        // Test orders (orderNumber prefixed "TEST-") skip the Ariston fulfillment
        // email so a live payment test never reaches the drop-ship partner.
        const isTestOrder = order.orderNumber.startsWith("TEST-");
        try {
          const results = await sendAllOrderEmails(payload, { skipDropship: isTestOrder });
          console.info(
            `Clover webhook emails sent for ${order.orderNumber}:`,
            JSON.stringify(results)
          );
        } catch (error) {
          console.warn(`Clover webhook email dispatch failed for ${order.orderNumber}:`, error);
        }
      }
    } else if (isFailure && order.status !== "CANCELLED" && order.status !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Clover webhook order update failed:", error);
    // Return 500 so Clover retries the delivery.
    return NextResponse.json({ error: "Order update failed" }, { status: 500 });
  }
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

/**
 * Coerce a Clover amount field into integer cents, or null when it can't be
 * resolved. Handles plain numbers/numeric strings (already cents) and the
 * `{ amount }` money-object shape Clover sometimes nests. Returns null for
 * absent/unparseable values so callers can refuse to mark an order PAID
 * without a verifiable amount.
 */
function parseAmountCents(raw: unknown): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw) : null;
  if (typeof raw === "bigint") return Number(raw);
  if (typeof raw === "string") {
    const n = Number(raw.trim());
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (isObject(raw)) {
    return parseAmountCents(pickField(raw, ["amount", "Amount", "value", "Value"]));
  }
  return null;
}

function pickField(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
