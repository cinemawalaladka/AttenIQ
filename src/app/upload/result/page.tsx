"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Users,
  UserPlus,
  UserX,
  BookOpen,
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export default function UploadResultPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("attendiq_process_result");
    if (!raw) {
      router.push("/upload");
      return;
    }
    try {
      setResultData(JSON.parse(raw));
    } catch {
      router.push("/upload");
    }
  }, [router]);

  if (!resultData) return null;

  const { uploadId, status, summary } = resultData;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
            Snapshot Created • ID: {uploadId.slice(0, 12)}...
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2">
            Attendance Sheet Processed
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data has been normalized, historical student identities resolved, and
            comparisons updated.
          </p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Processed
          </div>
          <div className="text-3xl font-black text-white">
            {summary.processedCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Students in sheet</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Matched
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {summary.matchedCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Existing enrolled</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1 mb-1">
            <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
            New Students
          </div>
          <div className="text-3xl font-black text-indigo-400">
            {summary.newCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">First appearance</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1 mb-1">
            <UserX className="w-3.5 h-3.5 text-amber-400" />
            Missing
          </div>
          <div className="text-3xl font-black text-amber-400">
            {summary.missingCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">From latest sheet</div>
        </div>
      </div>

      {/* Snapshot Comparison Details */}
      {(summary.newStudents?.length > 0 || summary.missingStudents?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* New Students Box */}
          {summary.newStudents?.length > 0 && (
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                New Students in this Snapshot ({summary.newStudents.length})
              </h4>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                {summary.newStudents.map((st: any, idx: number) => (
                  <li
                    key={idx}
                    className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">
                      {st.name}
                    </span>
                    <span className="font-mono text-indigo-400">
                      {st.enrollmentNumber}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Students Box */}
          {summary.missingStudents?.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-amber-400" />
                Missing from latest Snapshot ({summary.missingStudents.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                These students were in the previous upload but absent here. Their
                historical records remain intact.
              </p>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                {summary.missingStudents.map((st: any, idx: number) => (
                  <li
                    key={idx}
                    className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        {st.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {st.enrollmentNumber}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Last seen:{" "}
                      {st.lastDataReceivedAt
                        ? new Date(st.lastDataReceivedAt).toLocaleDateString()
                        : "Previous"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Warnings Box */}
      {summary.warnings?.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Recorded Warnings ({summary.warnings.length})</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1 pl-6 list-disc">
            {summary.warnings.slice(0, 4).map((w: string, i: number) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-800">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Open Command Centre</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          href="/uploads"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          <span>View Upload Timeline</span>
        </Link>
      </div>
    </div>
  );
}
