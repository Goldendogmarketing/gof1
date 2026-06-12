import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShieldCheck } from "lucide-react";
import { ChangePasswordForm } from "@/components/security/change-password-form";
import { authOptions, isAdminSession } from "@/lib/auth";
import { isMasterAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account security"
};

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/account?next=/account/security");
  }

  const email = session.user?.email?.toLowerCase() ?? "";
  const isMaster = isMasterAdminEmail(email);
  const isAdmin = isAdminSession(session);

  return (
    <main className="min-h-screen pt-28 lg:pt-[200px]">
      <div className="container py-12">
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Account</p>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Security</h1>
        <p className="mt-3 text-ink/65">
          Change your sign-in password. {isMaster ? "As the master admin, setting a password here also stores it in the database so you can recover access without editing environment variables." : null}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
          <ChangePasswordForm />
          <aside className="space-y-3 rounded-md border border-olive-900/10 bg-white/40 p-5 text-sm text-ink/70">
            <div className="flex items-center gap-2 text-olive-700">
              <ShieldCheck className="size-5" />
              <span className="font-semibold">Signed in as</span>
            </div>
            <p className="text-ink">{email}</p>
            <p className="text-xs text-ink/55">
              Role: <span className="font-semibold uppercase">{(session.user as { role?: string } | undefined)?.role ?? "CUSTOMER"}</span>
            </p>
            {isAdmin ? (
              <Link
                href="/admin"
                className="block text-xs font-semibold uppercase text-olive-700 underline hover:text-olive-900"
              >
                Back to admin panel
              </Link>
            ) : (
              <Link
                href="/account"
                className="block text-xs font-semibold uppercase text-olive-700 underline hover:text-olive-900"
              >
                Back to account
              </Link>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
