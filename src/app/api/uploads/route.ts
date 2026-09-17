import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const uploads = await db.upload.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        institute: true,
        branch: true,
      },
    });

    const formatted = uploads.map((u) => {
      let resultObj = null;
      try {
        if (u.processingResult) resultObj = JSON.parse(u.processingResult);
      } catch {}

      return {
        id: u.id,
        originalFilename: u.originalFilename,
        institute: u.institute?.code || "SOE",
        branch: u.branch?.code || "CSE",
        division: u.divisionName,
        semester: u.semester,
        academicYear: u.academicYear,
        period:
          u.periodStart && u.periodEnd
            ? `${u.periodStart.toLocaleDateString()} – ${u.periodEnd.toLocaleDateString()}`
            : "Semester",
        studentCount: u.detectedStudentCount,
        subjectCount: u.detectedSubjectCount,
        status: u.processingStatus,
        uploadedBy: u.uploadedBy,
        createdAt: u.createdAt.toISOString(),
        summary: resultObj,
      };
    });

    return NextResponse.json({ uploads: formatted });
  } catch (error: any) {
    console.error("Uploads API Error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
