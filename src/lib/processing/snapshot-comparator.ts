import { db } from "../db";
import { SnapshotComparisonResult } from "../types";

export interface SnapshotContext {
  instituteId?: string | null;
  branchId?: string | null;
  divisionName: string;
  semester: number;
  academicYear: string;
  currentEnrollments: string[];
  currentAverageAttendance: number;
}

export async function compareWithPreviousSnapshot(
  context: SnapshotContext
): Promise<SnapshotComparisonResult> {
  const {
    instituteId,
    branchId,
    divisionName,
    semester,
    academicYear,
    currentEnrollments,
    currentAverageAttendance,
  } = context;

  // Find the most recent previous completed upload for the same academic context
  const previousUpload = await db.upload.findFirst({
    where: {
      divisionName,
      semester,
      academicYear,
      processingStatus: { in: ["completed", "completed_with_warnings"] },
      ...(instituteId ? { instituteId } : {}),
      ...(branchId ? { branchId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      attendanceRecords: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!previousUpload) {
    // First snapshot in this context! All students are new
    const newStudents = await db.student.findMany({
      where: {
        enrollmentNumber: { in: currentEnrollments },
      },
      select: {
        enrollmentNumber: true,
        name: true,
      },
    });

    return {
      previousUploadId: null,
      previousSnapshotDate: null,
      previousStudentCount: 0,
      currentStudentCount: currentEnrollments.length,
      matchedCount: 0,
      newStudents: newStudents.map((s) => ({
        enrollmentNumber: s.enrollmentNumber,
        name: s.name,
      })),
      missingStudents: [],
      attendanceTrend: undefined,
    };
  }

  // Previous student enrollment map
  const prevEnrollmentMap = new Map<
    string,
    { name: string; lastDataReceivedAt: Date | null }
  >();

  let prevTotalPct = 0;
  for (const record of previousUpload.attendanceRecords) {
    prevEnrollmentMap.set(record.student.enrollmentNumber.toUpperCase(), {
      name: record.student.name,
      lastDataReceivedAt: record.student.lastDataReceivedAt,
    });
    prevTotalPct += record.overallPercentage;
  }

  const currentSet = new Set(currentEnrollments.map((e) => e.toUpperCase()));

  // Identify missing students (in previous, but not in current)
  const missingStudents: SnapshotComparisonResult["missingStudents"] = [];
  prevEnrollmentMap.forEach((info, enroll) => {
    if (!currentSet.has(enroll)) {
      missingStudents.push({
        enrollmentNumber: enroll,
        name: info.name,
        lastDataReceivedAt: info.lastDataReceivedAt
          ? info.lastDataReceivedAt.toISOString()
          : previousUpload.createdAt.toISOString(),
      });
    }
  });

  // Identify new students (in current, but not in previous)
  const newStudents: SnapshotComparisonResult["newStudents"] = [];
  let matchedCount = 0;

  for (const enroll of currentEnrollments) {
    const upper = enroll.toUpperCase();
    if (prevEnrollmentMap.has(upper)) {
      matchedCount++;
    } else {
      const student = await db.student.findUnique({
        where: { enrollmentNumber: upper },
        select: { name: true },
      });
      newStudents.push({
        enrollmentNumber: upper,
        name: student?.name || "New Student",
      });
    }
  }

  const prevAverage =
    previousUpload.attendanceRecords.length > 0
      ? Number(
          (prevTotalPct / previousUpload.attendanceRecords.length).toFixed(2)
        )
      : 0;

  const diff = Number((currentAverageAttendance - prevAverage).toFixed(2));

  return {
    previousUploadId: previousUpload.id,
    previousSnapshotDate: previousUpload.createdAt.toISOString(),
    previousStudentCount: previousUpload.attendanceRecords.length,
    currentStudentCount: currentEnrollments.length,
    matchedCount,
    newStudents,
    missingStudents,
    attendanceTrend: {
      previousAverage: prevAverage,
      currentAverage: currentAverageAttendance,
      difference: diff,
    },
  };
}
