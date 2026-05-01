import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="min-h-screen pt-28">
      <div className="container grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
        <AdminNav />
        <div>{children}</div>
      </div>
    </main>
  );
}
