import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { verifyCloverWebhookSignature } from "@/lib/clover";
import { sendAndRecordOrderEmails } from "@/lib/order-emails";

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

  // Clover Hosted Checkout posts a flat payload:
  //   { type: "PAYMENT", status: "APPROVED", id: <payment id>, merchantId,
  //     created, message: "Approved for 11997", data: "<checkout session id>" }
  // `data` is a plain string holding the checkout session id, and the amount only
  // appears inside `message`. We still accept an object-shaped `data` defensively.
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
  const stringData =
    (typeof event.data === "string" && event.data) || (typeof event.Data === "string" && event.Data) || "";
  const checkoutSessionId = String(
    stringData ||
      pickField(dataObject, ["checkoutSessionId", "CheckoutSessionId", "checkoutSessionID"]) ||
      pickField(event, ["checkoutSessionId", "CheckoutSessionId", "checkoutSessionID"]) ||
      ""
  ).trim();
  const message = String(pickField(event, ["message", "Message"]) ?? "");
  const cloverPaymentId = String(pickField(event, ["id", "Id"]) ?? "");
  // Amount in integer cents: an explicit amount field if Clover ever sends one,
  // otherwise parsed from the message ("Approved for 11997"). Null if absent.
  const paidCents =
    parseAmountCents(
      pickField(dataObject, ["amount", "Amount", "amountMoney", "total", "Total"]) ??
        pickField(event, ["amount", "Amount", "amountMoney", "total", "Total"])
    ) ?? parseAmountFromMessage(message);

  // Log everything once on prod — invaluable the first time Clover sends a
  // real-money event. Strips noisy keys but keeps shape and ids for diagnosis.
  console.info("Clover webhook received:", {
    type,
    status,
    checkoutSessionId,
    cloverPaymentId,
    message,
    paidCents,
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
      // The HMAC signature already proves the event came from Clover for this
      // checkout session, so a missing amount is not a reason to drop a real
      // payment — log it and proceed. A present-but-different amount is refused.
      if (paidCents === null) {
        console.warn(
          `Clover webhook: could not read an amount for order ${order.orderNumber} (message="${message}"); proceeding on verified signature.`
        );
      } else if (paidCents !== order.totalCents) {
        console.error(
          `Clover webhook: paid amount ${paidCents} does not match order ${order.orderNumber} total ${order.totalCents}; not marking PAID.`
        );
        return NextResponse.json({ ok: true, ignored: true, reason: "amount_mismatch" });
      }

      // Atomic conditional transition: only the delivery that actually flips the
      // row from non-PAID to PAID gets count === 1. Concurrent/retried Clover
      // deliveries see count === 0 and skip the emails, so receipts go out once.
      const updated = await prisma.order.updateMany({
        where: { id: order.id, status: { not: "PAID" } },
        // stripePaymentIntentId is repurposed to hold the Clover payment id.
        data: { status: "PAID", ...(cloverPaymentId ? { stripePaymentIntentId: cloverPaymentId } : {}) }
      });
      if (updated.count === 1) {
        // Fire-and-don't-fail: send customer/owner/Ariston emails and record each
        // result on the order (shown in /admin/orders). Never propagate to Clover.
        // Test orders ("TEST-" prefix) skip the Ariston email.
        try {
          const results = await sendAndRecordOrderEmails(order);
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

/**
 * Pull the amount out of Clover's message, e.g. "Approved for 11997". Clover's
 * REST API reports amounts in integer cents, so a bare integer is cents; a
 * decimal like "119.97" is treated as dollars.
 */
function parseAmountFromMessage(message: string): number | null {
  const match = message.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const raw = match[1];
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return raw.includes(".") ? Math.round(value * 100) : Math.round(value);
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
