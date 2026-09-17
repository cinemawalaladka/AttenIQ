"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Loader2,
  X,
  FileCheck,
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    id: string;
    date: string;
    division: string;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setDuplicateWarning(null);

    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "xls" && ext !== "xlsx") {
      setError(
        "Invalid file type. Please select an Excel attendance sheet (.xls or .xlsx)."
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum supported size is 20MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload/parse", {
        method: "POST",
        body: formData,
      });

      let data: any;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          res.status === 413
            ? "The spreadsheet file is too large for the server to process at once."
            : `Server encountered an issue (${res.status}). Please verify that the server is healthy.`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze attendance sheet.");
      }

      // Check duplicate
      if (data.isDuplicate && data.existingUploadInfo) {
        setDuplicateWarning(data.existingUploadInfo);
      }

      // Save to sessionStorage for Review Screen
      try {
        sessionStorage.setItem("attendiq_parse_data", JSON.stringify(data));
      } catch (storageErr) {
        throw new Error(
          "Browser storage quota exceeded. The parsed sheet metadata is too large for temporary session storage."
        );
      }

      // Navigate to Review Screen
      router.push("/upload/review");
    } catch (err: any) {
      setError(err?.message || "An error occurred while analyzing the spreadsheet.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Stage 1 & 2 • Ingestion Engine
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Upload Attendance Sheet
        </h1>
        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
          Excel files are treated as historical source snapshots. The system will
          inspect the sheet, extract academic context, and let you review
          detected metadata before committing.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-950/20 scale-[1.01]"
            : selectedFile
            ? "border-emerald-500/40 bg-slate-900/40"
            : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-lg shadow-blue-500/10">
              <UploadCloud className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200">
                Drag and drop your attendance sheet here, or{" "}
                <span className="text-blue-400 underline underline-offset-4">
                  browse
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Excel spreadsheets (.xls, .xlsx) up to 20MB
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Auto-header
                detection
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Traceable
                snapshot
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-base font-bold text-white max-w-md truncate">
                  {selectedFile.name}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setError(null);
                    setDuplicateWarning(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for metadata analysis
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze();
                }}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Sheet Structure...</span>
                  </>
                ) : (
                  <>
                    <span>Inspect & Review Metadata</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate Warning Box */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-amber-300">
              Duplicate File Detected
            </h4>
            <p className="text-amber-400/90 mt-0.5">
              An identical file was previously imported on{" "}
              <strong>{duplicateWarning.date}</strong> for Division{" "}
              <strong>{duplicateWarning.division}</strong>. You can still
              proceed to review and import as a new revision if needed.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-rose-300">Validation Notice</h4>
            <p className="text-rose-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-blue-400 font-bold text-xs uppercase mb-1">
            1. Zero Overwrite
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Existing student histories are never erased. Uploads append as
            discrete chronological snapshots.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-indigo-400 font-bold text-xs uppercase mb-1">
            2. Primary Identity
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enrollment numbers serve as the unique key. Students are tracked even
            if formatting or names vary.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-cyan-400 font-bold text-xs uppercase mb-1">
            3. Differential Tracking
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically surfaces students who are new, present, or missing
            from the latest upload.
          </p>
        </div>
      </div>
    </div>
  );
}
