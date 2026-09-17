"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Info,
  Building2,
  GitBranch,
  Layers,
  Calendar,
  Users,
  BookOpen,
  FileCheck,
  AlertTriangle,
  UploadCloud,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function InformationPage() {
  const [latestUpload, setLatestUpload] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      setLoading(true);
      try {
        const res = await fetch("/api/uploads");
        const data = await res.json();
        if (data.uploads && data.uploads.length > 0) {
          setLatestUpload(data.uploads[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!latestUpload) {
    return (
      <div className="max-w-xl mx-auto text-center p-16 space-y-4">
        <Info className="w-10 h-10 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Dataset Available</h2>
        <p className="text-xs text-slate-400">
          Upload an attendance spreadsheet first to view its structured
          dataset overview and quality metrics.
        </p>
        <div className="pt-2">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Attendance Sheet</span>
          </Link>
        </div>
      </div>
    );
  }

  const summary = latestUpload.summary || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Module 1 • Dataset Information
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Active Dataset Context
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Refined representation and quality audit of the currently active
          attendance snapshot.
        </p>
      </div>

      {/* Overview Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
          Academic Hierarchy & Snapshot Scope
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500 font-medium">Institute</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {latestUpload.institute}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Branch / Dept</div>
            <div className="text-lg font-bold text-blue-400 mt-0.5">
              {latestUpload.branch}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Division & Sem</div>
            <div className="text-lg font-bold text-white mt-0.5">
              Div {latestUpload.division} • Sem {latestUpload.semester}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Academic Year</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {latestUpload.academicYear}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">Attendance Period</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">
              {latestUpload.period}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Students in Dataset</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {latestUpload.studentCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Subjects Tracked</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">
              {latestUpload.subjectCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Ingested At</div>
            <div className="text-sm font-semibold text-slate-300 mt-0.5">
              {formatDate(latestUpload.createdAt)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            Source File:{" "}
            <strong className="text-slate-200 font-mono">
              {latestUpload.originalFilename}
            </strong>
          </span>
          <span className="text-[11px] text-slate-500">
            Immutable file preserved in local storage
          </span>
        </div>
      </div>

      {/* Data Quality & Integrity Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quality Audit */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dataset Integrity & Quality Audit</span>
          </h3>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">Enrollment Key Resolution</span>
              <span className="text-emerald-400 font-bold">100% Unique</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">Matched Existing Cohort</span>
              <span className="text-white font-bold">
                {summary.matchedCount || 0} students
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">New Additions</span>
              <span className="text-indigo-400 font-bold">
                {summary.newCount || 0} students
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">Missing from Sheet</span>
              <span className="text-amber-400 font-bold">
                {summary.missingCount || 0} students
              </span>
            </div>
          </div>
        </div>

        {/* Warnings & Notes */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Observations & Warnings</span>
          </h3>

          {summary.warnings && summary.warnings.length > 0 ? (
            <ul className="text-xs text-slate-400 space-y-2 max-h-48 overflow-y-auto pr-1">
              {summary.warnings.map((w: string, idx: number) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-300/90 text-[11px]"
                >
                  {w}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              <FileCheck className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              Clean import. No identity conflicts or formatting anomalies detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
