"use client";

import {
  SlidersHorizontal,
  Database,
  HardDrive,
  Shield,
  Layers,
  CheckCircle2,
  AlertOctagon,
  Award,
} from "lucide-react";
import { ATTENDANCE_STATUS_RULES, APP_CONFIG } from "@/lib/constants";

export default function SettingsPage() {
  const rules = Object.values(ATTENDANCE_STATUS_RULES);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          System Configuration • Settings
        </div>
        <h1 className="text-3xl font-extrabold text-white">Portal Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review institutional attendance thresholds, local SQLite storage
          parameters, and system identity keys.
        </p>
      </div>

      {/* Attendance Status Threshold Rules */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            <span>Attendance Status Threshold Bands</span>
          </span>
          <span className="text-xs text-slate-500 font-normal">
            Institutional Standards
          </span>
        </h3>

        <div className="space-y-2.5">
          {rules.map((rule) => (
            <div
              key={rule.key}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${rule.dotColor}`} />
                <span className="font-bold text-white text-sm">{rule.label}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-slate-300">
                  {rule.min}% — {rule.max}%
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${rule.badgeClass}`}
                >
                  {rule.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database & Storage Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Local Database (v1)</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Running on a fully relational SQLite engine with Prisma ORM. 100%
            isolated on your local machine with zero external cloud dependencies.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="text-slate-400">Engine: SQLite 3</div>
            <div className="text-slate-400">File: prisma/dev.db</div>
            <div className="text-emerald-400 font-semibold">Status: Connected & Synchronized</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Immutable Source Storage</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Uploaded Excel spreadsheets are cryptographically hashed (SHA-256)
            and saved to disk to ensure auditable provenance.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="text-slate-400">Directory: ./storage/attendance-uploads/</div>
            <div className="text-slate-400">Strategy: Year/Inst/Branch/Div</div>
            <div className="text-indigo-400 font-semibold">Status: Preserving Source Files</div>
          </div>
        </div>
      </div>
    </div>
  );
}
