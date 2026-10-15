import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { findCloverPayment } from "@/lib/clover";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { isTestOrder, sendAndRecordOrderEmails } from "@/lib/order-emails";

export const runtime = "nodejs";

/**
 * POST /api/admin/orders/[id]/mark-paid
 * Recovery for an order that was paid in Clover but never flipped to PAID (e.g.
 * the webhook was missed). Looks up a matching successful Clover payment first;
 * if found, marks the order PAID and sends the customer, owner and Ariston emails.
 *
 * With no matching Clover payment it refuses unless `?force=true` is passed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is required to manage orders." }, { status: 400 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "PENDING" && order.status !== "DRAFT") {
    return NextResponse.json(
      { error: `${order.orderNumber} is already ${order.status}.` },
      { status: 400 }
    );
  }

  const force = new URL(request.url).searchParams.get("force") === "true";

  // Look for the payment in Clover: exact amount, created no earlier than a few
  // minutes before the order (clock skew between our server and Clover).
  let payment: Awaited<ReturnType<typeof findCloverPayment>> = null;
  try {
    payment = await findCloverPayment({
      amountCents: order.totalCents,
      sinceMs: order.createdAt.getTime() - 5 * 60 * 1000
    });
  } catch (error) {
    if (!force) {
      return NextResponse.json(
        { error: `Couldn't reach Clover to verify payment: ${error instanceof Error ? error.message : String(error)}`, needsForce: true },
        { status: 502 }
      );
    }
  }

  if (!payment && !force) {
    return NextResponse.json(
      {
        error: `No successful Clover payment of ${(order.totalCents / 100).toFixed(2)} found since this order was placed.`,
        needsForce: true
      },
      { status: 409 }
    );
  }

  const updated = await prisma.order.updateMany({
    where: { id: order.id, status: { in: ["PENDING", "DRAFT"] } },
    data: { status: "PAID", ...(payment ? { stripePaymentIntentId: payment.id } : {}) }
  });
  if (updated.count !== 1) {
    return NextResponse.json({ error: "Order changed while updating — refresh and try again." }, { status: 409 });
  }

  const emails = await sendAndRecordOrderEmails(order);
  console.info(
    `Admin marked ${order.orderNumber} PAID (clover payment ${payment?.id ?? "none — forced"}); emails:`,
    JSON.stringify(emails)
  );

  return NextResponse.json({
    ok: true,
    cloverPaymentId: payment?.id ?? null,
    emails,
    aristonSkipped: isTestOrder(order.orderNumber)
  });
}
