import type { ReactNode } from "react";
import { cn } from "@/lib/ui";
export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red" | "violet";
  className?: string;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    blue: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/20",
    green:
      "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20",
    amber: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/20",
    red: "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-400/20",
    violet:
      "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
