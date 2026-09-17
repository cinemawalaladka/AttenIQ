import { NextRequest, NextResponse } from "next/server";
import { processAttendanceUpload } from "@/lib/processing/processor";
import { getTempUpload, cleanupTempUpload } from "@/lib/storage/local-storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileBase64, tempFileId, parseResult, confirmedMetadata, forceReimport } = body;

    let fileBuffer: Buffer | null = null;
    if (tempFileId) {
      fileBuffer = await getTempUpload(tempFileId);
    }
    if (!fileBuffer && fileBase64) {
      fileBuffer = Buffer.from(fileBase64, "base64");
    }

    if (!fileBuffer || !parseResult || !confirmedMetadata) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required processing parameters or uploaded file cache expired. Please re-upload your sheet.",
        },
        { status: 400 }
      );
    }

    if (!confirmedMetadata.institute || !confirmedMetadata.branch || !confirmedMetadata.division) {
      return NextResponse.json(
        { success: false, error: "Institute, Branch, and Division must be confirmed before processing." },
        { status: 400 }
      );
    }

    const result = await processAttendanceUpload({
      fileBuffer,
      parseResult,
      confirmedMetadata: {
        institute: confirmedMetadata.institute,
        program: confirmedMetadata.program || "B.Tech",
        branch: confirmedMetadata.branch,
        division: confirmedMetadata.division,
        semester: Number(confirmedMetadata.semester) || 3,
        academicYear: confirmedMetadata.academicYear || "2026-27",
        periodStart: confirmedMetadata.periodStart || null,
        periodEnd: confirmedMetadata.periodEnd || null,
      },
      uploadedBy: "System Administrator",
      forceReimport: Boolean(forceReimport),
    });

    // Clean up temporary file once successfully committed
    if (tempFileId) {
      await cleanupTempUpload(tempFileId);
    }

    return NextResponse.json({
      success: true,
      uploadId: result.uploadId,
      status: result.status,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error("Process API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to commit attendance dataset to the database.",
      },
      { status: 500 }
    );
  }
}
