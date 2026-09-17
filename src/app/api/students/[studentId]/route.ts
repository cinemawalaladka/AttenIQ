import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAttendanceStatus } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    const student = await db.student.findFirst({
      where: {
        OR: [{ id: studentId }, { enrollmentNumber: studentId.toUpperCase() }],
      },
      include: {
        institute: true,
        program: true,
        branch: true,
        attendanceRecords: {
          orderBy: { createdAt: "desc" },
          include: {
            upload: true,
            subjectRecords: {
              include: {
                subject: true,
              },
            },
          },
        },
        snapshotPresences: {
          orderBy: { createdAt: "desc" },
          include: {
            upload: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const latestRecord = student.attendanceRecords[0] || null;
    const overallPercentage = latestRecord ? latestRecord.overallPercentage : 0;
    const statusRule = getAttendanceStatus(overallPercentage);

    // Subject attendance from latest snapshot
    const subjects = latestRecord
      ? latestRecord.subjectRecords.map((s) => ({
          name: s.subject.name,
          conducted: s.conducted,
          present: s.present,
          absent: s.absent,
          percentage: s.percentage,
          hasDiscrepancy: s.hasDiscrepancy,
        }))
      : [];

    // Timeline of snapshots
    const history = student.attendanceRecords.map((rec) => ({
      uploadId: rec.uploadId,
      filename: rec.upload.originalFilename,
      date: rec.createdAt.toISOString(),
      percentage: rec.overallPercentage,
      conducted: rec.overallConducted,
      present: rec.overallPresent,
      absent: rec.overallAbsent,
      division: rec.upload.divisionName,
      semester: rec.upload.semester,
    }));

    // Presence across all uploads in this student's context
    const presenceHistory = student.snapshotPresences.map((sp) => ({
      uploadId: sp.uploadId,
      filename: sp.upload.originalFilename,
      date: sp.upload.createdAt.toISOString(),
      status: sp.presenceStatus, // "present", "new", "missing"
      period:
        sp.upload.periodStart && sp.upload.periodEnd
          ? `${sp.upload.periodStart.toLocaleDateString()} – ${sp.upload.periodEnd.toLocaleDateString()}`
          : "Snapshot",
    }));

    return NextResponse.json({
      student: {
        id: student.id,
        enrollmentNumber: student.enrollmentNumber,
        name: student.name,
        institute: student.institute?.name || student.institute?.code || "SOE",
        program: student.program?.name || student.program?.code || "B.Tech",
        branch: student.branch?.name || student.branch?.code || "CSE",
        currentDivision: student.currentDivision || "3B",
        firstSeenAt: student.firstSeenAt.toISOString(),
        lastDataReceivedAt: student.lastDataReceivedAt
          ? student.lastDataReceivedAt.toISOString()
          : null,
      },
      currentAttendance: {
        overallPercentage,
        overallConducted: latestRecord?.overallConducted || 0,
        overallPresent: latestRecord?.overallPresent || 0,
        overallAbsent: latestRecord?.overallAbsent || 0,
        status: statusRule,
        subjects,
      },
      history,
      presenceHistory,
    });
  } catch (error: any) {
    console.error("Student Detail API Error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
