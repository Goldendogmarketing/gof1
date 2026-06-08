import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { verifyCloverWebhookSignature } from "@/lib/clover";

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

  // Only enforce verification if the signing secret is configured. This lets a
  // development environment receive test webhooks before Clover is fully wired.
  const secret = process.env.CLOVER_WEBHOOK_SIGNATURE_KEY;
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

  // Clover sends a relatively flat payload; field casing has varied historically,
  // so we look up each interesting field defensively.
  const type = String(pickField(event, ["type", "Type", "eventType"]) ?? "").toUpperCase();
  const status = String(pickField(event, ["status", "Status"]) ?? "").toUpperCase();
  const checkoutSessionId = String(
    pickField(event, ["data", "Data", "checkoutSessionId", "CheckoutSessionId"]) ?? ""
  );

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
      where: { stripeCheckoutSessionId: checkoutSessionId }
    });

    if (!order) {
      // Could be a webhook for a checkout that wasn't persisted (e.g. DATABASE_URL
      // was missing at the time the checkout was created). Acknowledge.
      return NextResponse.json({ ok: true, matched: false });
    }

    if (isSuccess && order.status !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" }
      });
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

function pickField(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
}
