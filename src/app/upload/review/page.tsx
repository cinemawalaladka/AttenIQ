"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  GraduationCap,
  GitBranch,
  Layers,
  Calendar,
  Users,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { ParseResult } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();

  const [parseData, setParseData] = useState<{
    parseResult: ParseResult;
    tempFileId?: string;
    fileBase64?: string;
    isDuplicate: boolean;
    existingUploadInfo?: {
      id: string;
      date: string;
      division: string;
      semester: number;
      academicYear: string;
    } | null;
  } | null>(null);

  const [institute, setInstitute] = useState("SOE");
  const [program, setProgram] = useState("B.Tech");
  const [branch, setBranch] = useState("CSE");
  const [division, setDivision] = useState("3B");
  const [semester, setSemester] = useState(3);
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [forceReimport, setForceReimport] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("attendiq_parse_data");
    if (!raw) {
      router.push("/upload");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setParseData(parsed);

      const meta = parsed.parseResult?.metadata;
      if (meta) {
        if (meta.institute) setInstitute(meta.institute);
        if (meta.program) setProgram(meta.program);
        if (meta.branch) setBranch(meta.branch);
        if (meta.division) setDivision(meta.division);
        if (meta.semester) setSemester(meta.semester);
        if (meta.academicYear) setAcademicYear(meta.academicYear);
        if (meta.periodStart) setPeriodStart(meta.periodStart);
        if (meta.periodEnd) setPeriodEnd(meta.periodEnd);
      }
    } catch {
      router.push("/upload");
    }
  }, [router]);

  if (!parseData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const { parseResult } = parseData;
  const confidence = parseResult.metadata.confidence;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setProcessError(null);

    try {
      const res = await fetch("/api/upload/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempFileId: parseData.tempFileId,
          fileBase64: parseData.fileBase64,
          parseResult,
          forceReimport,
          confirmedMetadata: {
            institute,
            program,
            branch,
            division,
            semester,
            academicYear,
            periodStart: periodStart || null,
            periodEnd: periodEnd || null,
          },
        }),
      });

      let data: any;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          `Server encountered an issue (${res.status}): ${res.statusText || "Commit failed"}`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to commit dataset to database.");
      }

      // Store result and navigate to summary screen
      sessionStorage.setItem("attendiq_process_result", JSON.stringify(data));
      router.push("/upload/result");
    } catch (err: any) {
      setProcessError(err?.message || "An unexpected error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Step Indicator */}
      <div>
        <button
          onClick={() => router.push("/upload")}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Stage 3 & 4 • Review & Confirmation
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Verify Detected Context
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              External spreadsheets should never be blindly trusted. Confirm or
              edit the detected academic context below before committing to the
              database.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Students Detected</span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {parseResult.students.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Subjects Detected</span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {parseResult.subjects.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Academic Year</span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {academicYear}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Division / Sem</span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {division} • Sem {semester}
          </div>
        </div>
      </div>

      {/* Duplicate Warning & Revision Toggle */}
      {parseData.isDuplicate && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-amber-300 text-sm">
                Duplicate File Detected
              </h4>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                An identical spreadsheet was already imported
                {parseData.existingUploadInfo && (
                  <>
                    {" "}on <strong>{parseData.existingUploadInfo.date}</strong> for Division{" "}
                    <strong>{parseData.existingUploadInfo.division}</strong>
                  </>
                )}.
                To avoid accidental duplicate records, re-importing identical files requires confirmation.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3 pt-2 cursor-pointer select-none border-t border-amber-500/20">
            <input
              type="checkbox"
              checked={forceReimport}
              onChange={(e) => setForceReimport(e.target.checked)}
              className="w-4 h-4 rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-500/30 accent-amber-500"
            />
            <span className="text-xs font-semibold text-amber-200">
              I want to re-import this sheet as a new snapshot revision
            </span>
          </label>
        </div>
      )}

      {/* Editable Metadata Form */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <span>Academic Context Parameters</span>
          <span className="text-xs font-normal text-slate-400">
            (Values with green check were detected automatically)
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* Institute */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Institute
              </span>
              {confidence.institute === "high" ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Check
                </span>
              )}
            </label>
            <input
              type="text"
              value={institute}
              onChange={(e) => setInstitute(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. SOE"
            />
          </div>

          {/* Program */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Program
              </span>
              {confidence.program === "high" ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Check
                </span>
              )}
            </label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. B.Tech"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" /> Branch
              </span>
              {confidence.branch === "high" ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Check
                </span>
              )}
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. CSE"
            />
          </div>

          {/* Division */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" /> Division
              </span>
              {confidence.division === "high" ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Uncertain
                </span>
              )}
            </label>
            <input
              type="text"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. 3B"
            />
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Semester</span>
              {confidence.semester === "high" ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Check
                </span>
              )}
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Academic Year</span>
              {confidence.academicYear === "high" ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Check
                </span>
              )}
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. 2026-27"
            />
          </div>

          {/* Period Start */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attendance Period Start
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Period End */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attendance Period End
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Detected Subjects Preview */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Detected Subjects ({parseResult.subjects.length})</span>
          <span className="text-xs font-normal text-slate-400">
            Extracted from header columns
          </span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {parseResult.subjects.map((sub, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {sub.name}
            </span>
          ))}
          {parseResult.subjects.length === 0 && (
            <span className="text-xs text-slate-500 italic">
              No individual subjects separated; overall attendance will be recorded.
            </span>
          )}
        </div>
      </div>

      {/* Parser Warnings (if any) */}
      {parseResult.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Parser Observations ({parseResult.warnings.length})</span>
          </div>
          <ul className="text-xs text-amber-300/90 space-y-1 pl-6 list-disc">
            {parseResult.warnings.slice(0, 5).map((w, idx) => (
              <li key={idx}>{w.message}</li>
            ))}
            {parseResult.warnings.length > 5 && (
              <li className="italic text-amber-400">
                + {parseResult.warnings.length - 5} more warnings
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Process Error */}
      {processError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-rose-300">Commit Failed</h4>
            <p className="text-rose-400/90 mt-0.5">{processError}</p>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => router.push("/upload")}
          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          Cancel & Re-upload
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing || (parseData.isDuplicate && !forceReimport)}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            parseData.isDuplicate && !forceReimport
              ? "Please check 'I want to re-import this sheet as a new snapshot revision' to proceed"
              : undefined
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Normalizing & Committing Snapshot...</span>
            </>
          ) : (
            <>
              <span>
                {parseData.isDuplicate ? "Confirm & Import Revision" : "Confirm & Process Snapshot"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
