import { NextRequest, NextResponse } from "next/server";
import { parseAttendanceWorkbook } from "@/lib/parser/normalizer";
import { db } from "@/lib/db";
import { saveTempUpload } from "@/lib/storage/local-storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file was uploaded. Please select an attendance spreadsheet." },
        { status: 400 }
      );
    }

    const filename = file.name;
    const ext = filename.toLowerCase().split(".").pop();
    if (ext !== "xls" && ext !== "xlsx") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported file format. Please upload an Excel attendance sheet (.xls or .xlsx).",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse workbook
    const parseResult = parseAttendanceWorkbook(buffer, filename);

    // Check if identical file was already imported
    const existingUpload = await db.upload.findFirst({
      where: {
        fileHash: parseResult.fileHash,
        processingStatus: { in: ["completed", "completed_with_warnings"] },
      },
      select: {
        id: true,
        createdAt: true,
        divisionName: true,
        semester: true,
        academicYear: true,
      },
    });

    const isDuplicate = !!existingUpload;
    const existingUploadInfo = existingUpload
      ? {
          id: existingUpload.id,
          date: existingUpload.createdAt.toLocaleDateString(),
          division: existingUpload.divisionName,
          semester: existingUpload.semester,
          academicYear: existingUpload.academicYear,
        }
      : null;

    // Cache buffer in server-side temp storage so browser sessionStorage does not blow its 5MB limit
    const tempFileId = parseResult.fileHash;
    await saveTempUpload(buffer, tempFileId, filename);

    return NextResponse.json({
      success: true,
      parseResult,
      isDuplicate,
      existingUploadInfo,
      tempFileId,
    });
  } catch (error: any) {
    console.error("Parse API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "We could not read the student attendance sheet. Please ensure it is a valid Excel file.",
      },
      { status: 500 }
    );
  }
}
