import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAttendanceStatus } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const division = searchParams.get("division");
    const semester = searchParams.get("semester");
    const academicYear = searchParams.get("academicYear");
    const rangePreset = searchParams.get("rangePreset"); // "below_60", "60_74", "75_84", "85_89", "90_100"
    const minPct = searchParams.get("minPct") ? parseFloat(searchParams.get("minPct")!) : null;
    const maxPct = searchParams.get("maxPct") ? parseFloat(searchParams.get("maxPct")!) : null;
    const sortBy = searchParams.get("sortBy") || "percentage";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    // 1. Locate the active snapshot to view
    const latestUpload = await db.upload.findFirst({
      where: {
        processingStatus: { in: ["completed", "completed_with_warnings"] },
        ...(division ? { divisionName: division.toUpperCase() } : {}),
        ...(semester ? { semester: parseInt(semester, 10) } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestUpload) {
      return NextResponse.json({
        students: [],
        total: 0,
        page,
        totalPages: 0,
        activeUpload: null,
      });
    }

    // 2. Query attendance records for this upload
    let whereCondition: any = {
      uploadId: latestUpload.id,
    };

    if (search) {
      whereCondition.student = {
        OR: [
          { enrollmentNumber: { contains: search } },
          { name: { contains: search } },
        ],
      };
    }

    // Handle percentage filters
    let effectiveMin = minPct;
    let effectiveMax = maxPct;

    if (rangePreset === "below_60") {
      effectiveMin = 0;
      effectiveMax = 59.99;
    } else if (rangePreset === "60_74") {
      effectiveMin = 60;
      effectiveMax = 74.99;
    } else if (rangePreset === "75_84") {
      effectiveMin = 75;
      effectiveMax = 84.99;
    } else if (rangePreset === "85_89") {
      effectiveMin = 85;
      effectiveMax = 89.99;
    } else if (rangePreset === "90_100") {
      effectiveMin = 90;
      effectiveMax = 100;
    }

    if (effectiveMin !== null || effectiveMax !== null) {
      whereCondition.overallPercentage = {
        ...(effectiveMin !== null ? { gte: effectiveMin } : {}),
        ...(effectiveMax !== null ? { lte: effectiveMax } : {}),
      };
    }

    const total = await db.attendanceRecord.count({ where: whereCondition });

    let orderBy: any = {};
    if (sortBy === "percentage") {
      orderBy = { overallPercentage: sortOrder };
    } else if (sortBy === "name") {
      orderBy = { student: { name: sortOrder } };
    } else if (sortBy === "enrollment") {
      orderBy = { student: { enrollmentNumber: sortOrder } };
    } else {
      orderBy = { overallPercentage: sortOrder };
    }

    const records = await db.attendanceRecord.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
      include: {
        student: {
          include: {
            institute: true,
            branch: true,
          },
        },
        subjectRecords: {
          include: {
            subject: true,
          },
        },
      },
    });

    const students = records.map((r) => {
      const statusRule = getAttendanceStatus(r.overallPercentage);
      return {
        id: r.student.id,
        enrollmentNumber: r.student.enrollmentNumber,
        name: r.student.name,
        institute: r.student.institute?.code || "SOE",
        branch: r.student.branch?.code || "CSE",
        division: r.student.currentDivision || latestUpload.divisionName,
        overallConducted: r.overallConducted,
        overallPresent: r.overallPresent,
        overallAbsent: r.overallAbsent,
        overallPercentage: r.overallPercentage,
        statusKey: statusRule.key,
        statusLabel: statusRule.label,
        statusBadgeClass: statusRule.badgeClass,
        lastDataReceivedAt: r.student.lastDataReceivedAt,
        subjects: r.subjectRecords.map((s) => ({
          name: s.subject.name,
          conducted: s.conducted,
          present: s.present,
          absent: s.absent,
          percentage: s.percentage,
        })),
      };
    });

    return NextResponse.json({
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      activeUpload: {
        id: latestUpload.id,
        filename: latestUpload.originalFilename,
        division: latestUpload.divisionName,
        semester: latestUpload.semester,
        academicYear: latestUpload.academicYear,
        date: latestUpload.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Students API Error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
