"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  Award,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  UploadCloud,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { DashboardKPIs } from "@/lib/types";
import { formatPercentage, formatDate } from "@/lib/utils";

export default function CommandCentrePage() {
  const [metrics, setMetrics] = useState<DashboardKPIs | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeUploadInfo, setActiveUploadInfo] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("");
  const [semester, setSemester] = useState("");
  const [rangePreset, setRangePreset] = useState("");
  const [sortBy, setSortBy] = useState("percentage");
  const [sortOrder, setSortOrder] = useState("asc"); // asc or desc
  const [page, setPage] = useState(1);

  const fetchMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (division) params.set("division", division);
      if (semester) params.set("semester", semester);

      const res = await fetch(`/api/dashboard/metrics?${params.toString()}`);
      const data = await res.json();
      setMetrics(data);
      if (data.latestUploadMetadata) {
        setActiveUploadInfo(data.latestUploadMetadata);
      }
    } catch (e) {
      console.error(e);
    }
  }, [division, semester]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (division) params.set("division", division);
      if (semester) params.set("semester", semester);
      if (rangePreset) params.set("rangePreset", rangePreset);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", "25");

      const res = await fetch(`/api/dashboard/students?${params.toString()}`);
      const data = await res.json();
      setStudents(data.students || []);
      setTotalStudents(data.total || 0);
      if (data.activeUpload) {
        setActiveUploadInfo(data.activeUpload);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, division, semester, rangePreset, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchMetrics();
    fetchStudents();
  }, [fetchMetrics, fetchStudents]);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Command Centre • Realtime Intelligence
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Attendance Intelligence Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeUploadInfo ? (
              <span>
                Active Snapshot:{" "}
                <strong className="text-slate-200">
                  Div {activeUploadInfo.division}
                </strong>{" "}
                • Semester {activeUploadInfo.semester} (
                {activeUploadInfo.academicYear || "2026-27"})
              </span>
            ) : (
              "Upload an attendance spreadsheet to begin tracking student snapshots."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchMetrics();
              fetchStudents();
            }}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Sheet</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Students</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.totalStudents ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">In active context</div>
        </div>

        {/* Average Attendance */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Average Attn.</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {metrics ? formatPercentage(metrics.averageAttendance) : "0.0%"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Cohort average</div>
        </div>

        {/* Above 90% (Excellent) */}
        <button
          onClick={() => setRangePreset(rangePreset === "90_100" ? "" : "90_100")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            rangePreset === "90_100"
              ? "bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10"
              : "bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Above 90%</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {metrics?.above90Count ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Excellent standing</div>
        </button>

        {/* Below 75% (At Risk & Critical) */}
        <button
          onClick={() => setRangePreset(rangePreset === "60_74" ? "" : "60_74")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            rangePreset === "60_74"
              ? "bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-500/10"
              : "bg-slate-900/60 border-slate-800/80 hover:border-amber-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Below 75%</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {metrics?.below75Count ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Attendance alert</div>
        </button>

        {/* Below 60% (Critical) */}
        <button
          onClick={() => setRangePreset(rangePreset === "below_60" ? "" : "below_60")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            rangePreset === "below_60"
              ? "bg-rose-950/40 border-rose-500/50 shadow-md shadow-rose-500/10"
              : "bg-slate-900/60 border-slate-800/80 hover:border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Below 60%</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {metrics?.below60Count ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Critical threshold</div>
        </button>

        {/* Latest Dataset Date */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Latest Snapshot</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white mt-1.5 truncate">
            {metrics?.latestDatasetDate
              ? formatDate(metrics.latestDatasetDate)
              : "No data"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Total Uploads: {metrics?.totalUploads ?? 0}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by student name or enrollment number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Division (e.g. 3B)"
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium uppercase"
            />

            {/* Semester Filter */}
            <select
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">All Sems</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors shrink-0"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
              <span>{sortOrder === "asc" ? "Low → High" : "High → Low"}</span>
            </button>
          </div>
        </div>

        {/* Range Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Preset:
          </span>
          {[
            { label: "All Students", value: "" },
            { label: "Critical (<60%)", value: "below_60", color: "text-rose-400" },
            { label: "At Risk (60–74%)", value: "60_74", color: "text-amber-400" },
            { label: "Safe (75–84%)", value: "75_84", color: "text-teal-400" },
            { label: "Good (85–89%)", value: "85_89", color: "text-blue-400" },
            { label: "Excellent (≥90%)", value: "90_100", color: "text-emerald-400" },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setRangePreset(preset.value);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                rangePreset === preset.value
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : `bg-slate-950/80 hover:bg-slate-800 border border-slate-800 ${
                      preset.color || "text-slate-400"
                    }`
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Student Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center p-16 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              No Attendance Records Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No students match the current filters, or no attendance sheet has
              been uploaded yet.
            </p>
            <div className="pt-2">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Sheet</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Enrollment Number</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Context</th>
                  <th className="py-3.5 px-4">Conducted / Present</th>
                  <th className="py-3.5 px-4 text-right">Attendance %</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Last Received</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {students.map((student) => {
                  const pct = student.overallPercentage;
                  let barColor = "bg-emerald-500";
                  if (pct < 60) barColor = "bg-rose-500";
                  else if (pct < 75) barColor = "bg-amber-500";
                  else if (pct < 85) barColor = "bg-teal-500";

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Enrollment */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <Link
                          href={`/students/${student.enrollmentNumber}`}
                          className="hover:text-blue-400 hover:underline flex items-center gap-1.5"
                        >
                          {student.enrollmentNumber}
                        </Link>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {student.name}
                      </td>

                      {/* Context */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono">
                          {student.division || "3B"} • Sem {student.semester || 3}
                        </span>
                      </td>

                      {/* Conducted / Present */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span>{student.overallPresent}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-slate-400">
                          {student.overallConducted}
                        </span>
                      </td>

                      {/* Percentage & Progress Bar */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-100 min-w-[42px] text-right">
                            {formatPercentage(pct)}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${student.statusBadgeClass}`}
                        >
                          {student.statusLabel}
                        </span>
                      </td>

                      {/* Last Received Date */}
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                        {formatDate(student.lastDataReceivedAt)}
                      </td>

                      {/* Detail CTA */}
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/students/${student.enrollmentNumber}`}
                          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-blue-600 hover:text-white text-slate-400 inline-flex items-center justify-center transition-all group-hover:border group-hover:border-blue-500/40"
                          title="Open Student Intelligence Profile"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Counter */}
        <div className="py-3 px-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong>{students.length}</strong> of{" "}
            <strong>{totalStudents}</strong> students
          </span>
          <span className="text-[11px] text-slate-500">
            Click any student row to view cross-snapshot history & subject data
          </span>
        </div>
      </div>
    </div>
  );
}
