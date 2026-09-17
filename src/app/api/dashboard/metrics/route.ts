import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const division = searchParams.get("division");
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const academicYear = searchParams.get("academicYear");

    // 1. Find latest relevant upload
    const latestUpload = await db.upload.findFirst({
      where: {
        processingStatus: { in: ["completed", "completed_with_warnings"] },
        ...(division ? { divisionName: division.toUpperCase() } : {}),
        ...(semester ? { semester: parseInt(semester, 10) } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        attendanceRecords: true,
      },
    });

    if (!latestUpload || latestUpload.attendanceRecords.length === 0) {
      return NextResponse.json({
        totalStudents: 0,
        averageAttendance: 0,
        below75Count: 0,
        below60Count: 0,
        above90Count: 0,
        latestDatasetDate: null,
        totalUploads: await db.upload.count(),
        totalDivisions: 0,
      });
    }

    const records = latestUpload.attendanceRecords;
    const totalStudents = records.length;

    let totalPct = 0;
    let below75 = 0;
    let below60 = 0;
    let above90 = 0;

    for (const r of records) {
      totalPct += r.overallPercentage;
      if (r.overallPercentage < 60) below60++;
      if (r.overallPercentage < 75) below75++;
      if (r.overallPercentage >= 90) above90++;
    }

    const averageAttendance =
      totalStudents > 0 ? Number((totalPct / totalStudents).toFixed(1)) : 0;

    const totalUploads = await db.upload.count();
    const totalDivisions = await db.division.count();

    return NextResponse.json({
      totalStudents,
      averageAttendance,
      below75Count: below75,
      below60Count: below60,
      above90Count: above90,
      latestDatasetDate: latestUpload.createdAt.toISOString(),
      latestUploadId: latestUpload.id,
      latestUploadMetadata: {
        institute: latestUpload.instituteId,
        branch: latestUpload.branchId,
        division: latestUpload.divisionName,
        semester: latestUpload.semester,
        academicYear: latestUpload.academicYear,
        period:
          latestUpload.periodStart && latestUpload.periodEnd
            ? `${latestUpload.periodStart.toLocaleDateString()} – ${latestUpload.periodEnd.toLocaleDateString()}`
            : null,
      },
      totalUploads,
      totalDivisions,
    });
  } catch (error: any) {
    console.error("Metrics API Error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
