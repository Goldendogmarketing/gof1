import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { hasDatabaseUrl, prisma } from "@/lib/db";

export const runtime = "nodejs";

// Statuses that the admin is allowed to hard-delete. Paid/fulfilled/refunded
// orders are accounting records — we don't want a stray click to remove them.
const DELETABLE_STATUSES = new Set(["DRAFT", "PENDING", "CANCELLED"]);

/**
 * DELETE /api/admin/orders/[id]
 * Hard-deletes an unprocessed order (and its items via Prisma cascade).
 * Refuses to delete PAID, FULFILLED, or REFUNDED orders.
 *
 * Pass `?force=true` to override the status guard (still admin-only).
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is required to manage orders." }, { status: 400 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, status: true }
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  if (!force && !DELETABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      {
        error: `Refusing to delete ${order.status} order ${order.orderNumber}. Paid/fulfilled orders are accounting records — pass ?force=true if you really mean it.`
      },
      { status: 409 }
    );
  }

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true, deletedOrderNumber: order.orderNumber });
}
