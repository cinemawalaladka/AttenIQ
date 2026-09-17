"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, ChevronRight, Clock, Loader2, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllStudents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("limit", "100");

        const res = await fetch(`/api/dashboard/students?${params.toString()}`);
        const data = await res.json();
        setStudents(data.students || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAllStudents();
  }, [search]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Directory • Student Registry
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Student Intelligence Directory
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse students across all divisions, view historical snapshots and
          attendance trajectory.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by student name or enrollment number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
        />
      </div>

      {/* Student List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">No students found.</p>
            <p>Upload an attendance sheet to populate students.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {students.map((st) => (
              <Link
                key={st.id}
                href={`/students/${st.enrollmentNumber}`}
                className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-white font-bold text-sm group-hover:border-blue-500/50 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{st.name}</span>
                      <span className="font-mono text-xs text-blue-400 font-normal">
                        {st.enrollmentNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>
                        {st.branch} • Div {st.division}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" /> Last data:{" "}
                        {formatDate(st.lastDataReceivedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${st.statusBadgeClass}`}
                  >
                    {st.statusLabel} ({st.overallPercentage.toFixed(1)}%)
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
