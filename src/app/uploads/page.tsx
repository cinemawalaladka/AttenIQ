"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ChevronRight,
  Loader2,
  Calendar,
  Layers,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function UploadHistoryPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUploads() {
      setLoading(true);
      try {
        const res = await fetch("/api/uploads");
        const data = await res.json();
        setUploads(data.uploads || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUploads();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Timeline • Historical Traceability
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Upload History & Snapshots
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Every imported attendance spreadsheet is retained as an immutable
            historical snapshot with full audit records.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Sheet</span>
        </Link>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : uploads.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-3">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">No Uploads Yet</h3>
            <p className="max-w-xs mx-auto">
              Your uploaded attendance sheets and snapshot histories will be
              listed here.
            </p>
            <div className="pt-2">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs"
              >
                Upload First Sheet
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Upload / Filename</th>
                  <th className="py-3.5 px-4">Academic Context</th>
                  <th className="py-3.5 px-4">Students</th>
                  <th className="py-3.5 px-4">Subjects</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Uploaded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {uploads.map((u) => {
                  const isSuccess =
                    u.status === "completed" ||
                    u.status === "completed_with_warnings";
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Filename / ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white max-w-[180px] truncate">
                              {u.originalFilename}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {u.id.slice(0, 10)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Context */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                          {u.institute} • {u.branch} • Div {u.division} • Sem{" "}
                          {u.semester}
                        </span>
                      </td>

                      {/* Students */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        {u.studentCount}
                      </td>

                      {/* Subjects */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {u.subjectCount}
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.period}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSuccess
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
