import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui";
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 bg-[#202a44]/95 shadow-card backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
