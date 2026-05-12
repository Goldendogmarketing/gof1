import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Package, ShieldCheck } from "lucide-react";
import { AccountPanel } from "@/components/account-panel";
import { CustomerOrders } from "@/components/customer-orders";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { authOptions, isAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account"
};

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="min-h-screen pt-28 lg:pt-[240px]">
        <div className="container grid gap-8 py-12 lg:grid-cols-[0.9fr_420px]">
          <section>
            <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Account</p>
            <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
              Sign in to track orders and reorder favorites.
            </h1>
            <p className="mt-5 max-w-xl leading-8 text-ink/68">
              Customers see order history and one-tap reorders. Admin staff sign in here to manage the catalog,
              promotions, and homepage content.
            </p>
          </section>
          <AccountPanel next={params.next ?? "/account"} />
        </div>
      </main>
    );
  }

  const admin = isAdminSession(session);
  const firstName = session.user?.name?.split(" ")[0];

  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <div className="container py-12">
        <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Account</p>
        <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
          Welcome back{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-3 text-ink/65">{session.user?.email}</p>

        {admin ? (
          <section className="mt-10 grid gap-6 rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="size-6 text-olive-700" />
                <h2 className="font-display text-2xl text-ink">Admin tools</h2>
              </div>
              <p className="text-ink/68">
                Manage products, orders, promotions, and homepage content from the admin panel.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <Button asChild>
                <Link href="/admin">
                  <ShieldCheck className="size-4" />
                  Open Admin Panel
                </Link>
              </Button>
              <SignOutButton />
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <Package className="size-6 text-olive-700" />
            <h2 className="font-display text-2xl text-ink">Your orders</h2>
          </div>
          <CustomerOrders email={session.user?.email ?? ""} />
        </section>

        {!admin ? (
          <div className="mt-10 flex justify-end">
            <SignOutButton />
          </div>
        ) : null}
      </div>
    </main>
  );
}
