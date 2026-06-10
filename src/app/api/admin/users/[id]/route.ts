import { NextResponse } from "next/server";
import { isMasterAdminEmail, requireMasterAdmin } from "@/lib/admin";
import { hasDatabaseUrl, prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/users/[id]
 * Revokes admin access by demoting the user to CUSTOMER (preserves history /
 * doesn't break foreign keys). Master only. The master account cannot be revoked.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireMasterAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is required to manage admin users." }, { status: 400 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (isMasterAdminEmail(user.email)) {
    return NextResponse.json({ error: "The master admin cannot be revoked." }, { status: 403 });
  }

  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    return NextResponse.json({ error: "User is not an admin." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: "CUSTOMER" },
    select: { id: true, email: true, role: true }
  });

  return NextResponse.json({ user: updated });
}
