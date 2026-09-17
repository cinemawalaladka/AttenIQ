export type AttendanceStatusKey =
  | "EXCELLENT"
  | "GOOD"
  | "SAFE"
  | "AT_RISK"
  | "CRITICAL";

export interface AttendanceStatusRule {
  key: AttendanceStatusKey;
  label: string;
  min: number;
  max: number;
  badgeClass: string;
  dotColor: string;
  textColor: string;
  bgLight: string;
}

export interface ParsedMetadata {
  institute?: string;
  program?: string;
  branch?: string;
  division?: string;
  semester?: number;
  academicYear?: string;
  periodStart?: string;
  periodEnd?: string;
  studentCount: number;
  subjectCount: number;
  confidence: {
    institute: "high" | "medium" | "low";
    program: "high" | "medium" | "low";
    branch: "high" | "medium" | "low";
    division: "high" | "medium" | "low";
    semester: "high" | "medium" | "low";
    academicYear: "high" | "medium" | "low";
    period: "high" | "medium" | "low";
  };
}

export interface ParsedSubject {
  name: string;
  code?: string;
}

export interface ParsedSubjectAttendance {
  subjectName: string;
  conducted: number;
  present: number;
  absent: number;
  percentage: number;
  rawPercentage?: number;
  hasDiscrepancy?: boolean;
}

export interface ParsedStudentRow {
  enrollmentNumber: string;
  name: string;
  overallConducted: number;
  overallPresent: number;
  overallAbsent: number;
  overallPercentage: number;
  subjects: ParsedSubjectAttendance[];
  warnings: string[];
}

export interface ParseResult {
  metadata: ParsedMetadata;
  subjects: ParsedSubject[];
  students: ParsedStudentRow[];
  warnings: Array<{
    type: "warning" | "error" | "info";
    message: string;
    row?: number;
    column?: string;
  }>;
  fileHash: string;
  originalFilename: string;
  tempFilePath?: string;
}

export interface SnapshotComparisonResult {
  previousUploadId: string | null;
  previousSnapshotDate: string | null;
  previousStudentCount: number;
  currentStudentCount: number;
  matchedCount: number;
  newStudents: Array<{
    enrollmentNumber: string;
    name: string;
  }>;
  missingStudents: Array<{
    enrollmentNumber: string;
    name: string;
    lastDataReceivedAt: string | null;
  }>;
  attendanceTrend?: {
    previousAverage: number;
    currentAverage: number;
    difference: number;
  };
}

export interface DashboardKPIs {
  totalStudents: number;
  averageAttendance: number;
  below75Count: number;
  below60Count: number;
  above90Count: number;
  latestDatasetDate: string | null;
  totalUploads: number;
  totalDivisions: number;
}
