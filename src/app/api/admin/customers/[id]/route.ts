import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { customerUpdateSchema } from "@/lib/validations";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/customers/[id]
 * Updates editable customer fields (email, firstName, lastName, phone, marketingOptIn).
 * Only the fields the caller sends are touched.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is required to manage customers." }, { status: 400 });
  }

  const parsed = customerUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid customer details." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  // Catch email collisions before Prisma throws a P2002.
  if (parsed.data.email && parsed.data.email !== existing.email) {
    const conflict = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
    if (conflict) {
      return NextResponse.json({ error: "Another customer already uses that email." }, { status: 409 });
    }
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: parsed.data
  });

  return NextResponse.json({ customer: updated });
}

/**
 * DELETE /api/admin/customers/[id]
 * Hard-deletes the customer record (right-to-be-forgotten).
 * Their historical orders survive with customerId set to null (the FK is
 * onDelete: SetNull), so accounting records aren't broken.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is required to manage customers." }, { status: 400 });
  }

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } }
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  await prisma.customer.delete({ where: { id } });

  return NextResponse.json({
    ok: true,
    deletedEmail: customer.email,
    ordersDecoupled: customer._count.orders
  });
}
