import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { requireAdmin, requireMasterAdmin } from "@/lib/admin";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { newAdminUserSchema } from "@/lib/validations";

export const runtime = "nodejs";

/**
 * GET /api/admin/users
 * Lists every user with an admin or staff role.
 * Visible to any admin (transparency) so they know who else has access.
 */
export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });

  return NextResponse.json({ users });
}

/**
 * POST /api/admin/users
 * Creates a new admin/staff user. Master only.
 * Body: { email, name, password, role? }
 */
export async function POST(request: Request) {
  await requireMasterAdmin();
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "DATABASE_URL is required to manage admin users." }, { status: 400 });
  }

  const parsed = newAdminUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid user details." },
      { status: 400 }
    );
  }

  const { email, name, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, role, passwordHash },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });

  return NextResponse.json({ user }, { status: 201 });
}
