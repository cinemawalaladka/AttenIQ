"use client";

import Link from "next/link";
import { UploadCloud, Layers, ShieldCheck } from "lucide-react";

interface HeaderProps {
  contextBadge?: {
    institute?: string;
    program?: string;
    branch?: string;
    division?: string;
    semester?: number | string;
    period?: string;
  };
}

export function Header({ contextBadge }: HeaderProps) {
  const currentContext = contextBadge || {
    institute: "SOE",
    program: "B.Tech",
    branch: "CSE",
    division: "3B",
    semester: "3",
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Academic Context Indicator (Context First Principle) */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">Context:</span>
          <span className="font-semibold text-white">
            {currentContext.institute || "SOE"}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">
            {currentContext.program || "B.Tech"}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-blue-400 font-semibold">
            {currentContext.branch || "CSE"}
          </span>
          <span className="text-slate-600">/</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
            Div {currentContext.division || "3B"}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">
            Sem {currentContext.semester || "3"}
          </span>
        </div>

        {currentContext.period && (
          <span className="hidden md:inline-flex text-xs px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/60 text-slate-400">
            📅 {currentContext.period}
          </span>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium">Local Storage Active</span>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Sheet</span>
        </Link>
      </div>
    </header>
  );
}
