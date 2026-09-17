import { AttendanceStatusKey, AttendanceStatusRule } from "./types";

export const ATTENDANCE_STATUS_RULES: Record<AttendanceStatusKey, AttendanceStatusRule> = {
  EXCELLENT: {
    key: "EXCELLENT",
    label: "Excellent",
    min: 90,
    max: 100,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    dotColor: "bg-emerald-400",
    textColor: "text-emerald-400",
    bgLight: "bg-emerald-950/20",
  },
  GOOD: {
    key: "GOOD",
    label: "Good",
    min: 85,
    max: 89.99,
    badgeClass: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    dotColor: "bg-blue-400",
    textColor: "text-blue-400",
    bgLight: "bg-blue-950/20",
  },
  SAFE: {
    key: "SAFE",
    label: "Safe",
    min: 75,
    max: 84.99,
    badgeClass: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
    dotColor: "bg-teal-400",
    textColor: "text-teal-400",
    bgLight: "bg-teal-950/20",
  },
  AT_RISK: {
    key: "AT_RISK",
    label: "At Risk",
    min: 60,
    max: 74.99,
    badgeClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    dotColor: "bg-amber-400",
    textColor: "text-amber-400",
    bgLight: "bg-amber-950/20",
  },
  CRITICAL: {
    key: "CRITICAL",
    label: "Critical",
    min: 0,
    max: 59.99,
    badgeClass: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    dotColor: "bg-rose-400",
    textColor: "text-rose-400",
    bgLight: "bg-rose-950/20",
  },
};

export function getAttendanceStatus(percentage: number): AttendanceStatusRule {
  if (percentage >= 90) return ATTENDANCE_STATUS_RULES.EXCELLENT;
  if (percentage >= 85) return ATTENDANCE_STATUS_RULES.GOOD;
  if (percentage >= 75) return ATTENDANCE_STATUS_RULES.SAFE;
  if (percentage >= 60) return ATTENDANCE_STATUS_RULES.AT_RISK;
  return ATTENDANCE_STATUS_RULES.CRITICAL;
}

export const APP_CONFIG = {
  name: "AttendIQ",
  subtitle: "Attendance Analytics Portal",
  version: "1.0.0",
  defaultAcademicYear: "2026-27",
  defaultSemester: 3,
};
