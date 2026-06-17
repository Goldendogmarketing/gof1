import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = {
  label: string;
  href?: string;
};

/**
 * Simple breadcrumb trail (Home / Category / Product). The last crumb is the
 * current page and is rendered as plain text. JSON-LD BreadcrumbList is emitted
 * separately on the PDP, so this component stays purely presentational.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink/60">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3.5 text-ink/35" aria-hidden /> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-olive-700">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-ink/80" : undefined} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
