"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Settings2,
  ScanSearch,
} from "lucide-react";
import { cn } from "@/lib/ui";
const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/settings", label: "Settings", icon: Settings2 },
];
export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar-shell border-b border-slate-200 text-white md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0">
      <div className="relative z-10 flex h-20 items-center gap-3 px-6">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-lg shadow-orange-950/30">
          <ScanSearch className="h-5 w-5" />
        </span>
        <div>
          <div className="font-bold tracking-tight">JobChecker</div>
          <div className="text-[10px] uppercase tracking-[.18em] text-slate-400">
            Stack intelligence
          </div>
        </div>
      </div>
      <nav className="relative z-10 flex gap-1 overflow-auto px-3 pb-3 md:block md:space-y-2 md:py-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 whitespace-nowrap rounded-md border-l-2 border-transparent px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white",
                active &&
                  "border-amber-300 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-950/25",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-6 left-4 right-4 z-10 hidden rounded-lg border border-white/10 bg-[#202a44]/80 p-3 text-xs leading-5 text-slate-400 backdrop-blur-sm md:block">
        Paste messy job lists. Get clean, scored opportunities.
      </div>
    </aside>
  );
}
