"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  UploadCloud,
  History,
  Info,
  Users,
  SlidersHorizontal,
  Database,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Command Centre",
    href: "/",
    icon: BarChart3,
    badge: "Live",
  },
  {
    label: "Upload Sheet",
    href: "/upload",
    icon: UploadCloud,
    highlight: true,
  },
  {
    label: "Upload History",
    href: "/uploads",
    icon: History,
  },
  {
    label: "Dataset Info",
    href: "/information",
    icon: Info,
  },
  {
    label: "Student Intelligence",
    href: "/students",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: SlidersHorizontal,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between fixed inset-y-0 left-0 z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Attend<span className="text-blue-400 font-extrabold">IQ</span>
              </span>
              <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-semibold">
                Analytics Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                    : item.highlight
                    ? "text-slate-300 hover:text-white hover:bg-slate-900 border border-dashed border-blue-500/30 bg-blue-950/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-blue-400"
                        : item.highlight
                        ? "text-blue-400"
                        : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Active Session */}
      <div className="p-4 border-t border-slate-800/60 space-y-3">
        {/* Local Storage / DB Badge */}
        <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Local SQLite</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-slate-200 font-semibold text-xs border border-slate-600">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
              Admin User
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 inline" />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Local Mode (v1)
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
