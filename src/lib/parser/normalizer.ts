import * as XLSX from "xlsx";
import { ParseResult, ParsedStudentRow, ParsedSubject, ParsedSubjectAttendance } from "../types";
import { detectMetadataFromSheet } from "./metadata-detector";
import { computeFileHash } from "./hash";

export function parseAttendanceWorkbook(
  buffer: Buffer,
  originalFilename: string
): ParseResult {
  const fileHash = computeFileHash(buffer);
  const warnings: ParseResult["warnings"] = [];

  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetNames = workbook.SheetNames;

  if (!sheetNames || sheetNames.length === 0) {
    throw new Error("The uploaded Excel workbook contains no readable sheets.");
  }

  // Use the first sheet or the first non-empty sheet
  const firstSheet = workbook.Sheets[sheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (rawRows.length < 3) {
    throw new Error("The uploaded spreadsheet is empty or has fewer than 3 rows of data.");
  }

  // 1. Detect Metadata
  const detectedMeta = detectMetadataFromSheet(rawRows);

  // 2. Locate the student header row
  let headerRowIndex = -1;
  let enrollColIndex = -1;
  let nameColIndex = -1;
  let overallPctColIndex = -1;
  let overallPresentColIndex = -1;
  let overallConductedColIndex = -1;

  for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
    const row = rawRows[r].map((cell) => String(cell || "").toLowerCase().trim());
    
    // Check for enrollment number first (highest priority)
    let foundEnroll = row.findIndex(
      (c) =>
        c.includes("enroll") ||
        c.includes("enrolment") ||
        c.includes("reg. no") ||
        c.includes("reg no") ||
        c.includes("registration")
    );

    // Fallback to roll no only if explicit enrollment is not found
    if (foundEnroll === -1) {
      foundEnroll = row.findIndex(
        (c) =>
          c.includes("roll no") ||
          c.includes("rollno") ||
          c.includes("student id") ||
          c === "roll"
      );
    }

    const foundName = row.findIndex(
      (c) =>
        c.includes("student name") ||
        c.includes("name of student") ||
        c === "name" ||
        c.includes("candidate name")
    );

    if (foundEnroll !== -1 && foundName !== -1) {
      headerRowIndex = r;
      enrollColIndex = foundEnroll;
      nameColIndex = foundName;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      "We could not identify the student table columns in this spreadsheet. Please ensure the sheet contains 'Enrollment Number' and 'Student Name' columns."
    );
  }

  const headerRow = rawRows[headerRowIndex].map((c) => String(c || "").trim());
  const prevHeaderRow =
    headerRowIndex > 0 ? rawRows[headerRowIndex - 1].map((c) => String(c || "").trim()) : [];

  // Look for overall attendance columns
  for (let c = 0; c < headerRow.length; c++) {
    const colName = headerRow[c].toLowerCase();
    const prevColName = (prevHeaderRow[c] || "").toLowerCase();

    if (
      (colName.includes("total") || colName.includes("overall")) &&
      (colName.includes("%") || colName.includes("percent"))
    ) {
      overallPctColIndex = c;
    } else if (colName.includes("%") || colName.includes("percentage")) {
      if (overallPctColIndex === -1) overallPctColIndex = c;
    }

    if (
      (colName.includes("total") || colName.includes("overall")) &&
      (colName.includes("present") || colName === "p")
    ) {
      overallPresentColIndex = c;
    }

    if (
      (colName.includes("total") || colName.includes("overall")) &&
      (colName.includes("conduct") || colName.includes("total class") || colName === "c")
    ) {
      overallConductedColIndex = c;
    }
  }

  // 3. Detect Subjects from Header columns
  // Subjects typically appear between Name and Overall columns
  const subjects: ParsedSubject[] = [];
  const subjectColMap: Map<number, { subjectName: string; type: "conducted" | "present" | "absent" | "percentage" }> = new Map();

  let currentSubjectName = "";
  for (let c = 0; c < headerRow.length; c++) {
    if (c === enrollColIndex || c === nameColIndex) continue;

    const h = headerRow[c].trim();
    const prevH = (prevHeaderRow[c] || "").trim();
    const lowerH = h.toLowerCase();

    // Skip non-subject identifier columns
    if (
      lowerH.includes("enroll") ||
      lowerH.includes("roll") ||
      lowerH.includes("reg") ||
      lowerH.includes("s.no") ||
      lowerH.includes("sr.no") ||
      lowerH.includes("serial") ||
      lowerH.includes("remark") ||
      lowerH === "sr" ||
      lowerH === "sno"
    ) {
      continue;
    }

    // If multi-row header (e.g. Row 4: Subject Name, Row 5: P, A, C, %)
    if (
      prevH &&
      !prevH.toLowerCase().includes("student") &&
      !prevH.toLowerCase().includes("enroll") &&
      !prevH.toLowerCase().includes("roll")
    ) {
      currentSubjectName = prevH;
    }

    // Check subject attendance type column suffixes
    if (
      lowerH.includes("conducted") ||
      lowerH === "c" ||
      lowerH.includes("total") && !lowerH.includes("overall")
    ) {
      if (currentSubjectName) {
        subjectColMap.set(c, { subjectName: currentSubjectName, type: "conducted" });
        if (!subjects.some((s) => s.name === currentSubjectName)) {
          subjects.push({ name: currentSubjectName });
        }
      }
    } else if (lowerH.includes("present") || lowerH === "p" || lowerH.includes("attended")) {
      if (currentSubjectName) {
        subjectColMap.set(c, { subjectName: currentSubjectName, type: "present" });
        if (!subjects.some((s) => s.name === currentSubjectName)) {
          subjects.push({ name: currentSubjectName });
        }
      }
    } else if (lowerH.includes("absent") || lowerH === "a") {
      if (currentSubjectName) {
        subjectColMap.set(c, { subjectName: currentSubjectName, type: "absent" });
      }
    } else if (lowerH.includes("%") || lowerH.includes("percentage")) {
      if (currentSubjectName && c !== overallPctColIndex) {
        subjectColMap.set(c, { subjectName: currentSubjectName, type: "percentage" });
      }
    } else if (h.length > 2 && !lowerH.includes("overall") && !lowerH.includes("remark")) {
      // Direct subject header
      currentSubjectName = h;
      if (!subjects.some((s) => s.name === currentSubjectName)) {
        subjects.push({ name: currentSubjectName });
      }
      subjectColMap.set(c, { subjectName: currentSubjectName, type: "percentage" });
    }
  }

  // 4. Parse Student Data Rows
  const students: ParsedStudentRow[] = [];
  const seenEnrollments = new Set<string>();

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawEnroll = String(row[enrollColIndex] || "").trim();
    const rawName = String(row[nameColIndex] || "").trim();

    // Stop or skip summary/footer rows
    const lowerEnroll = rawEnroll.toLowerCase();
    const lowerName = rawName.toLowerCase();
    if (
      lowerEnroll.includes("total") ||
      lowerEnroll.includes("average") ||
      lowerName.includes("total") ||
      lowerName.includes("average") ||
      lowerEnroll.includes("signature")
    ) {
      continue;
    }

    if (!rawEnroll && !rawName) continue;

    if (!rawEnroll && rawName) {
      warnings.push({
        type: "warning",
        message: `Row ${r + 1}: Student "${rawName}" is missing an enrollment number.`,
        row: r + 1,
      });
      continue;
    }

    if (seenEnrollments.has(rawEnroll.toUpperCase())) {
      warnings.push({
        type: "warning",
        message: `Row ${r + 1}: Duplicate enrollment number "${rawEnroll}". Only first occurrence will be processed.`,
        row: r + 1,
      });
      continue;
    }
    seenEnrollments.add(rawEnroll.toUpperCase());

    // Extract subject-level attendance
    const subjectAttendanceMap = new Map<string, ParsedSubjectAttendance>();
    for (const sub of subjects) {
      subjectAttendanceMap.set(sub.name, {
        subjectName: sub.name,
        conducted: 0,
        present: 0,
        absent: 0,
        percentage: 0,
      });
    }

    subjectColMap.forEach(({ subjectName, type }, colIdx) => {
      const cellVal = parseFloat(String(row[colIdx] || "0").replace(/[^0-9.]/g, "")) || 0;
      const entry = subjectAttendanceMap.get(subjectName);
      if (entry) {
        if (type === "conducted") entry.conducted = cellVal;
        if (type === "present") entry.present = cellVal;
        if (type === "absent") entry.absent = cellVal;
        if (type === "percentage") {
          entry.percentage = cellVal;
          entry.rawPercentage = cellVal;
        }
      }
    });

    // Reconcile subject stats
    const studentSubjects: ParsedSubjectAttendance[] = [];
    let sumConducted = 0;
    let sumPresent = 0;
    let sumAbsent = 0;

    subjectAttendanceMap.forEach((entry) => {
      if (entry.conducted > 0 && entry.percentage === 0 && entry.present > 0) {
        entry.percentage = Number(((entry.present / entry.conducted) * 100).toFixed(2));
      }
      if (entry.conducted > 0 && entry.absent === 0) {
        entry.absent = Math.max(0, entry.conducted - entry.present);
      }
      sumConducted += entry.conducted;
      sumPresent += entry.present;
      sumAbsent += entry.absent;
      studentSubjects.push(entry);
    });

    // Extract or calculate overall percentage
    let overallPct = 0;
    if (overallPctColIndex !== -1) {
      overallPct = parseFloat(String(row[overallPctColIndex] || "0").replace(/[^0-9.]/g, "")) || 0;
    }

    let overallPresent =
      overallPresentColIndex !== -1
        ? parseInt(String(row[overallPresentColIndex] || "0"), 10) || sumPresent
        : sumPresent;

    let overallConducted =
      overallConductedColIndex !== -1
        ? parseInt(String(row[overallConductedColIndex] || "0"), 10) || sumConducted
        : sumConducted;

    if (overallPct === 0 && overallConducted > 0) {
      overallPct = Number(((overallPresent / overallConducted) * 100).toFixed(2));
    } else if (overallPct === 0 && studentSubjects.length > 0) {
      const validSubPcts = studentSubjects.map((s) => s.percentage).filter((p) => p > 0);
      if (validSubPcts.length > 0) {
        overallPct = Number(
          (validSubPcts.reduce((a, b) => a + b, 0) / validSubPcts.length).toFixed(2)
        );
      }
    }

    students.push({
      enrollmentNumber: rawEnroll.toUpperCase(),
      name: rawName,
      overallConducted,
      overallPresent,
      overallAbsent: Math.max(0, overallConducted - overallPresent),
      overallPercentage: Math.min(100, Math.max(0, overallPct)),
      subjects: studentSubjects,
      warnings: [],
    });
  }

  detectedMeta.studentCount = students.length;
  detectedMeta.subjectCount = subjects.length;

  return {
    metadata: detectedMeta,
    subjects,
    students,
    warnings,
    fileHash,
    originalFilename,
  };
}
