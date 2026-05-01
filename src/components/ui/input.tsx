import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-sm border border-olive-700/20 bg-white/75 px-3 text-sm text-ink outline-none transition placeholder:text-olive-700/45 focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
