import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-olive-700/15 bg-white/65 px-3 py-1 text-xs font-semibold uppercase text-olive-700",
        className
      )}
      {...props}
    />
  );
}
