import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-sm border border-olive-700/20 bg-white/75 px-3 py-3 text-sm text-ink outline-none transition placeholder:text-olive-700/45 focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
