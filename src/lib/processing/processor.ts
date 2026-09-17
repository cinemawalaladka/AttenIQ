import { db } from "../db";
import { ParseResult } from "../types";
import { storeOriginalExcelFile } from "../storage/local-storage";
import { compareWithPreviousSnapshot } from "./snapshot-comparator";

export interface ProcessUploadParams {
  fileBuffer: Buffer;
  parseResult: ParseResult;
  confirmedMetadata: {
    institute: string;
    program: string;
    branch: string;
    division: string;
    semester: number;
    academicYear: string;
    periodStart?: string | null;
    periodEnd?: string | null;
  };
  uploadedBy?: string;
  forceReimport?: boolean;
}

export async function processAttendanceUpload(params: ProcessUploadParams) {
  const { fileBuffer, parseResult, confirmedMetadata, uploadedBy = "Admin", forceReimport = false } = params;

  // 1. Check for duplicate upload using fileHash or identical context + period
  const existingUpload = await db.upload.findFirst({
    where: {
      fileHash: parseResult.fileHash,
      processingStatus: { in: ["completed", "completed_with_warnings"] },
    },
  });

  if (existingUpload && !forceReimport) {
    throw new Error(
      `This file has already been imported on ${existingUpload.createdAt.toLocaleDateString()} (Upload ID: ${existingUpload.id}). To import as a new revision, check "Import as new snapshot revision".`
    );
  }

  // 2. Store original file locally
  const storedFile = await storeOriginalExcelFile(
    fileBuffer,
    parseResult.originalFilename,
    confirmedMetadata.academicYear,
    confirmedMetadata.institute,
    confirmedMetadata.branch,
    confirmedMetadata.division
  );

  // 3. Resolve or Create Institute, Program, Branch, Division Hierarchy
  let institute = await db.institute.findUnique({
    where: { code: confirmedMetadata.institute.toUpperCase() },
  });
  if (!institute) {
    institute = await db.institute.create({
      data: {
        code: confirmedMetadata.institute.toUpperCase(),
        name: confirmedMetadata.institute,
      },
    });
  }

  let program = await db.program.findUnique({
    where: {
      instituteId_code: {
        instituteId: institute.id,
        code: confirmedMetadata.program.toUpperCase(),
      },
    },
  });
  if (!program) {
    program = await db.program.create({
      data: {
        instituteId: institute.id,
        code: confirmedMetadata.program.toUpperCase(),
        name: confirmedMetadata.program,
      },
    });
  }

  let branch = await db.branch.findUnique({
    where: {
      programId_code: {
        programId: program.id,
        code: confirmedMetadata.branch.toUpperCase(),
      },
    },
  });
  if (!branch) {
    branch = await db.branch.create({
      data: {
        programId: program.id,
        code: confirmedMetadata.branch.toUpperCase(),
        name: confirmedMetadata.branch,
      },
    });
  }

  let division = await db.division.findUnique({
    where: {
      branchId_name_semester_academicYear: {
        branchId: branch.id,
        name: confirmedMetadata.division.toUpperCase(),
        semester: confirmedMetadata.semester,
        academicYear: confirmedMetadata.academicYear,
      },
    },
  });
  if (!division) {
    division = await db.division.create({
      data: {
        branchId: branch.id,
        name: confirmedMetadata.division.toUpperCase(),
        semester: confirmedMetadata.semester,
        academicYear: confirmedMetadata.academicYear,
      },
    });
  }

  // 4. Create Initial Upload Record
  const upload = await db.upload.create({
    data: {
      originalFilename: parseResult.originalFilename,
      storagePath: storedFile.storagePath,
      fileHash: parseResult.fileHash,
      instituteId: institute.id,
      programId: program.id,
      branchId: branch.id,
      divisionId: division.id,
      divisionName: confirmedMetadata.division.toUpperCase(),
      semester: confirmedMetadata.semester,
      academicYear: confirmedMetadata.academicYear,
      periodStart: confirmedMetadata.periodStart ? new Date(confirmedMetadata.periodStart) : null,
      periodEnd: confirmedMetadata.periodEnd ? new Date(confirmedMetadata.periodEnd) : null,
      detectedStudentCount: parseResult.students.length,
      detectedSubjectCount: parseResult.subjects.length,
      processingStatus: "processing",
      uploadedBy,
    },
  });

  const uploadWarnings: string[] = [...parseResult.warnings.map((w) => w.message)];
  if (existingUpload && forceReimport) {
    uploadWarnings.push(
      `Imported as a new revision of previous upload from ${existingUpload.createdAt.toLocaleDateString()} (Upload ID: ${existingUpload.id}).`
    );
  }

  try {
    // 5. Resolve / Upsert Subjects
    const subjectMap = new Map<string, string>(); // name -> id
    for (const sub of parseResult.subjects) {
      let subject = await db.subject.findUnique({
        where: {
          name_semester: {
            name: sub.name,
            semester: confirmedMetadata.semester,
          },
        },
      });
      if (!subject) {
        subject = await db.subject.create({
          data: {
            name: sub.name,
            code: sub.code,
            branchId: branch.id,
            semester: confirmedMetadata.semester,
          },
        });
      }
      subjectMap.set(sub.name, subject.id);
    }

    // 6. Resolve / Upsert Students & Attendance Records
    const now = new Date();
    const currentEnrollments = parseResult.students.map((s) => s.enrollmentNumber.toUpperCase());
    let totalPctSum = 0;

    for (const studentData of parseResult.students) {
      const enroll = studentData.enrollmentNumber.toUpperCase();
      totalPctSum += studentData.overallPercentage;

      let student = await db.student.findUnique({
        where: { enrollmentNumber: enroll },
      });

      if (!student) {
        student = await db.student.create({
          data: {
            enrollmentNumber: enroll,
            name: studentData.name,
            instituteId: institute.id,
            programId: program.id,
            branchId: branch.id,
            currentDivision: confirmedMetadata.division.toUpperCase(),
            firstSeenAt: now,
            lastDataReceivedAt: confirmedMetadata.periodEnd
              ? new Date(confirmedMetadata.periodEnd)
              : now,
          },
        });
      } else {
        // Identity Conflict Warning: Same enrollment, different name
        if (student.name.toLowerCase() !== studentData.name.toLowerCase()) {
          uploadWarnings.push(
            `Student ${enroll} was previously recorded as "${student.name}", but sheet lists "${studentData.name}".`
          );
        }
        await db.student.update({
          where: { id: student.id },
          data: {
            currentDivision: confirmedMetadata.division.toUpperCase(),
            lastDataReceivedAt: confirmedMetadata.periodEnd
              ? new Date(confirmedMetadata.periodEnd)
              : now,
          },
        });
      }

      // Create Attendance Record
      const attRecord = await db.attendanceRecord.create({
        data: {
          uploadId: upload.id,
          studentId: student.id,
          overallConducted: studentData.overallConducted,
          overallPresent: studentData.overallPresent,
          overallAbsent: studentData.overallAbsent,
          overallPercentage: studentData.overallPercentage,
          statusInSnapshot: "present",
        },
      });

      // Create Subject Attendance Records
      for (const subAtt of studentData.subjects) {
        const subjectId = subjectMap.get(subAtt.subjectName);
        if (subjectId) {
          await db.attendanceSubjectRecord.create({
            data: {
              attendanceRecordId: attRecord.id,
              subjectId,
              conducted: subAtt.conducted,
              present: subAtt.present,
              absent: subAtt.absent,
              percentage: subAtt.percentage,
              hasDiscrepancy: subAtt.hasDiscrepancy || false,
              rawPercentage: subAtt.rawPercentage,
            },
          });
        }
      }
    }

    const currentAvg =
      parseResult.students.length > 0
        ? Number((totalPctSum / parseResult.students.length).toFixed(2))
        : 0;

    // 7. Snapshot Comparison against previous upload
    const comparison = await compareWithPreviousSnapshot({
      instituteId: institute.id,
      branchId: branch.id,
      divisionName: confirmedMetadata.division.toUpperCase(),
      semester: confirmedMetadata.semester,
      academicYear: confirmedMetadata.academicYear,
      currentEnrollments,
      currentAverageAttendance: currentAvg,
    });

    // Record presence for present students
    for (const enroll of currentEnrollments) {
      const student = await db.student.findUnique({
        where: { enrollmentNumber: enroll },
        select: { id: true },
      });
      if (student) {
        const isNew = comparison.newStudents.some((s) => s.enrollmentNumber === enroll);
        await db.studentSnapshotPresence.create({
          data: {
            studentId: student.id,
            uploadId: upload.id,
            presenceStatus: isNew ? "new" : "present",
          },
        });
      }
    }

    // Record presence for missing students from previous snapshot
    for (const missing of comparison.missingStudents) {
      const student = await db.student.findUnique({
        where: { enrollmentNumber: missing.enrollmentNumber },
        select: { id: true },
      });
      if (student) {
        await db.studentSnapshotPresence.create({
          data: {
            studentId: student.id,
            uploadId: upload.id,
            presenceStatus: "missing",
          },
        });
      }
    }

    // 8. Commit Status & Store Processing Summary
    const finalStatus =
      uploadWarnings.length > 0 ? "completed_with_warnings" : "completed";

    const processingResult = JSON.stringify({
      processedCount: parseResult.students.length,
      subjectsCount: parseResult.subjects.length,
      matchedCount: comparison.matchedCount,
      newCount: comparison.newStudents.length,
      missingCount: comparison.missingStudents.length,
      newStudents: comparison.newStudents,
      missingStudents: comparison.missingStudents,
      trend: comparison.attendanceTrend,
      warnings: uploadWarnings,
    });

    const updatedUpload = await db.upload.update({
      where: { id: upload.id },
      data: {
        processingStatus: finalStatus,
        processingResult,
        processedAt: new Date(),
      },
    });

    return {
      uploadId: updatedUpload.id,
      status: finalStatus,
      summary: JSON.parse(processingResult),
    };
  } catch (error: any) {
    // Transactional rollback / mark failed
    await db.upload.update({
      where: { id: upload.id },
      data: {
        processingStatus: "failed",
        processingResult: JSON.stringify({ error: error?.message || "Unknown error" }),
      },
    });
    throw error;
  }
}
