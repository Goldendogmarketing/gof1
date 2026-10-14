import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { isTestOrder, resendDropshipEmail } from "@/lib/order-emails";

export const runtime = "nodejs";

/**
 * POST /api/admin/orders/[id]/resend-dropship
 * Re-sends the Ariston fulfillment email for a paid order and records the result.
 * Used from /admin/orders when the original send failed or Ariston asks for it again.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is required to manage orders." }, { status: 400 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (isTestOrder(order.orderNumber)) {
    return NextResponse.json({ error: "Test orders are never sent to Ariston." }, { status: 400 });
  }
  if (order.status !== "PAID" && order.status !== "FULFILLED") {
    return NextResponse.json(
      { error: `Only paid orders go to Ariston — ${order.orderNumber} is ${order.status}.` },
      { status: 400 }
    );
  }

  const result = await resendDropshipEmail(order);
  if (!result.sent) {
    return NextResponse.json({ error: result.reason ?? "Email could not be sent.", result }, { status: 502 });
  }
  return NextResponse.json({ ok: true, result });
}
