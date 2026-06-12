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
      // Could be a webhook for a checkout that wasn't persisted (e.g. DATABASE_URL
      // was missing at the time the checkout was created). Acknowledge.
      return NextResponse.json({ ok: true, matched: false });
    }

    if (isSuccess) {
      // Only fire emails on the first PAID transition — Clover retries can deliver
      // the same event multiple times, and we never want to send duplicate receipts.
      const alreadyPaid = order.status === "PAID";
      if (!alreadyPaid) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID" }
        });

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
        try {
          const results = await sendAllOrderEmails(payload);
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
