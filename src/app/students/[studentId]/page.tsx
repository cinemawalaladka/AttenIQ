"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Building2,
  GitBranch,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Loader2,
  BookOpen,
} from "lucide-react";
import { formatDate, formatPercentage } from "@/lib/utils";

export default function StudentIntelligencePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.studentId;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/students/${studentId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load student.");
        setData(json);
      } catch (err: any) {
        setError(err?.message || "Error loading student profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto text-center p-12 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Student Not Found</h2>
        <p className="text-xs text-slate-400">
          We could not find any attendance snapshot for enrollment ID: {studentId}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Command Centre
        </Link>
      </div>
    );
  }

  const { student, currentAttendance, history, presenceHistory } = data;
  const status = currentAttendance.status;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Centre
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {student.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-blue-400 font-bold">
                  {student.enrollmentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>{student.institute}</span>
                <span>•</span>
                <span>{student.program}</span>
                <span>•</span>
                <span>{student.branch}</span>
                <span>•</span>
                <span className="text-slate-300 font-semibold">
                  Div {student.currentDivision}
                </span>
              </p>
            </div>
          </div>

          {/* Last Data Received Badge */}
          <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Last Attendance Received
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 justify-end mt-0.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {student.lastDataReceivedAt
                ? formatDate(student.lastDataReceivedAt)
                : "Not Recorded"}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Overall Attendance
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">
              {formatPercentage(currentAttendance.overallPercentage)}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${status.badgeClass}`}
            >
              {status.label}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                currentAttendance.overallPercentage >= 75
                  ? "bg-emerald-400"
                  : currentAttendance.overallPercentage >= 60
                  ? "bg-amber-400"
                  : "bg-rose-400"
              }`}
              style={{
                width: `${Math.min(100, currentAttendance.overallPercentage)}%`,
              }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Total Conducted
          </div>
          <div className="text-3xl font-black text-white">
            {currentAttendance.overallConducted}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Classes scheduled
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Classes Present
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {currentAttendance.overallPresent}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Attended sessions</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Classes Absent
          </div>
          <div className="text-3xl font-black text-rose-400">
            {currentAttendance.overallAbsent}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Missed sessions</div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Subject-wise Attendance Breakdown</span>
        </h3>

        {currentAttendance.subjects.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No individual subject records found in the latest snapshot.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3 text-right">Conducted</th>
                  <th className="py-2.5 px-3 text-right">Present</th>
                  <th className="py-2.5 px-3 text-right">Absent</th>
                  <th className="py-2.5 px-3 text-right">Percentage</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {currentAttendance.subjects.map((sub: any, idx: number) => {
                  let subBadge = "text-emerald-400 bg-emerald-500/10";
                  if (sub.percentage < 60)
                    subBadge = "text-rose-400 bg-rose-500/10";
                  else if (sub.percentage < 75)
                    subBadge = "text-amber-400 bg-amber-500/10";

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {sub.name}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {sub.conducted}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                        {sub.present}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400">
                        {sub.absent}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatPercentage(sub.percentage)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${subBadge}`}
                        >
                          {sub.percentage >= 75 ? "Safe" : "At Risk"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Presence Timeline across Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Presence Across Uploads (Section 14) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Dataset Presence Audit</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Tracks whether this student was present or missing from each
            comparable upload snapshot over time.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {presenceHistory.map((ph: any, i: number) => {
              const isMissing = ph.status === "missing";
              return (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isMissing
                      ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                      : "bg-slate-950 border-slate-800 text-slate-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">
                      {formatDate(ph.date)}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                      {ph.filename}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isMissing
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {isMissing ? "Missing in Sheet" : "Present in Dataset"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Snapshot Attendance History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Snapshot Progression</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Historical attendance observations preserved for this student.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {history.map((h: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    {formatPercentage(h.percentage)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {h.present} / {h.conducted} classes • Div {h.division}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-300">
                    {formatDate(h.date)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Sem {h.semester}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
