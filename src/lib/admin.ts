import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";

/**
 * The "master admin" is the one account that can manage the list of other
 * admins. Every other admin can use the admin panel but can't grant or
 * revoke admin access. Identified by the MASTER_ADMIN_EMAIL env var
 * (falls back to ADMIN_EMAIL for backwards compatibility).
 */
export function getMasterAdminEmail(): string | null {
  const raw = process.env.MASTER_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
  if (!raw) return null;
  return raw.trim().toLowerCase();
}

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const master = getMasterAdminEmail();
  if (!master) return false;
  return email.trim().toLowerCase() === master;
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (isAdminSession(session)) return session;

  if (process.env.NODE_ENV === "development" && !process.env.ADMIN_EMAIL) {
    return {
      user: {
        name: "Demo Owner",
        email: "owner@greekolivefusion.local",
        role: "ADMIN"
      }
    };
  }

  redirect("/account?next=/admin");
}

/**
 * Like requireAdmin, but also requires the caller is the master admin.
 * Use this in API routes that mutate the admin user list.
 */
export async function requireMasterAdmin() {
  const session = await requireAdmin();
  const email = (session as { user?: { email?: string } } | null)?.user?.email;
  if (!isMasterAdminEmail(email)) {
    // Mirror requireAdmin's behavior — kick non-master back to the account page.
    redirect("/admin?error=master-only");
  }
  return session;
}
