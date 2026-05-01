import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "Account"
};

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/admin";
  return (
    <main className="min-h-screen pt-28">
      <div className="container grid gap-8 py-12 lg:grid-cols-[0.9fr_420px]">
        <section>
          <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Account/Admin</p>
          <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
            Owner access, customer history, and order tools.
          </h1>
          <p className="mt-5 max-w-xl leading-8 text-ink/68">
            Admin sign-in uses the seeded owner account or the environment admin credentials configured for launch.
          </p>
        </section>
        <AccountPanel next={next} />
      </div>
    </main>
  );
}
