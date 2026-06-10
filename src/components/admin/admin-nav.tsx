import Link from "next/link";
import { BarChart3, Boxes, FileText, Settings, ShieldCheck, ShoppingBag, UsersRound } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/users", label: "Admin Users", icon: ShieldCheck },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminNav() {
  return (
    <aside className="rounded-md border border-olive-900/10 bg-white/65 p-3 shadow-soft lg:sticky lg:top-24 lg:h-fit">
      <nav className="grid gap-1" aria-label="Admin navigation">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-sm px-3 py-3 text-sm font-semibold text-olive-900 transition hover:bg-olive-700/10"
            >
              <Icon className="size-4 text-gold-600" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
