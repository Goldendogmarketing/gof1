"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-sm border border-olive-700/20 bg-white/75 px-3 pr-10 text-sm text-ink outline-none transition focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-olive-700" />
    </span>
  );
}
