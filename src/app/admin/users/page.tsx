import { AdminUsers } from "@/components/admin/admin-users";
import { getMasterAdminEmail, isMasterAdminEmail, requireAdmin } from "@/lib/admin";
import { hasDatabaseUrl, prisma } from "@/lib/db";

// Always rebuild — the user list changes when the master grants/revokes access.
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const viewerEmail = (session as { user?: { email?: string } } | null)?.user?.email ?? null;
  const viewerIsMaster = isMasterAdminEmail(viewerEmail);
  const masterEmail = getMasterAdminEmail();

  // Pull every admin/staff user from the DB.
  const rows = hasDatabaseUrl()
    ? await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "STAFF"] } },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }]
      })
    : [];

  // Add the master admin as a synthetic row if they don't have a DB user record
  // (the env-admin login path doesn't create a DB row).
  const dbHasMaster = masterEmail ? rows.some((row) => row.email.toLowerCase() === masterEmail) : true;
  const synthMaster = !dbHasMaster && masterEmail
    ? [{
        id: "master-env",
        email: masterEmail,
        name: "Master admin (env credential)",
        role: "ADMIN" as const,
        createdAt: new Date(0)
      }]
    : [];

  const users = [...synthMaster, ...rows].map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isMaster: isMasterAdminEmail(row.email),
    createdAt: row.createdAt.toISOString()
  }));

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Access</p>
        <h1 className="font-display text-5xl text-ink">Admin users</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          The master admin can grant other people access to this panel by adding them as Admin or Staff. Granted users
          can do everything in the admin panel <em>except</em> add or remove other admins.
        </p>
      </div>
      <AdminUsers users={users} viewerIsMaster={viewerIsMaster} />
    </section>
  );
}
