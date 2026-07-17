import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui";
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-orange-950/30 hover:from-amber-400 hover:to-red-500",
        variant === "secondary" &&
          "border border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
