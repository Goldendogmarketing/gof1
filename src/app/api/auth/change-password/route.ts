import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isMasterAdminEmail } from "@/lib/admin";
import { prisma, hasDatabaseUrl } from "@/lib/db";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(10, "New password must be at least 10 characters"),
    confirmPassword: z.string().min(1)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one"
  });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email?.toLowerCase();
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid request.", field: issue?.path?.[0] },
      { status: 400 }
    );
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured. Cannot change password yet." },
      { status: 503 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;
  const newHash = await hash(newPassword, 12);

  // Case 1: signed in via the env-admin shortcut. They have no DB row yet, so
  // their "current password" is the env ADMIN_PASSWORD. After we accept the
  // change we create a DB User row so future logins go through the DB and don't
  // depend on the env shortcut.
  const isMaster = isMasterAdminEmail(sessionEmail);
  const envPassword = process.env.ADMIN_PASSWORD;
  const existing = await prisma.user.findUnique({ where: { email: sessionEmail } });

  if (!existing) {
    if (!isMaster || !envPassword || currentPassword !== envPassword) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }

    await prisma.user.create({
      data: {
        email: sessionEmail,
        name: session?.user?.name ?? "Greek Olive Fusion Owner",
        passwordHash: newHash,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ ok: true, created: true });
  }

  // Case 2: regular DB-backed user (admin or staff) changing their own password.
  if (!existing.passwordHash) {
    return NextResponse.json(
      { error: "Account has no password set; contact the master admin." },
      { status: 400 }
    );
  }

  const matches = await compare(currentPassword, existing.passwordHash);
  if (!matches) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: { passwordHash: newHash }
  });

  return NextResponse.json({ ok: true });
}
