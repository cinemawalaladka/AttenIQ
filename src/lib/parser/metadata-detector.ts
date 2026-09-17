import { ParsedMetadata } from "../types";

export function detectMetadataFromSheet(rawRows: any[][]): ParsedMetadata {
  let institute: string | undefined;
  let program: string | undefined;
  let branch: string | undefined;
  let division: string | undefined;
  let semester: number | undefined;
  let academicYear: string | undefined;
  let periodStart: string | undefined;
  let periodEnd: string | undefined;

  const confidence: ParsedMetadata["confidence"] = {
    institute: "low",
    program: "low",
    branch: "low",
    division: "low",
    semester: "low",
    academicYear: "low",
    period: "low",
  };

  // Inspect the first 15 rows where metadata usually lives
  const inspectionRows = rawRows.slice(0, 15);
  const textCorpus = inspectionRows
    .map((row) =>
      row
        .filter((cell) => cell !== null && cell !== undefined)
        .map((cell) => String(cell).trim())
        .join(" ")
    )
    .join("\n");

  // 1. Academic Year (e.g. 2026-27, 2026-2027, 2025-26)
  const ayMatch = textCorpus.match(/\b(20\d{2}\s*[-–/]\s*(?:\d{2}|\d{4}))\b/i);
  if (ayMatch) {
    academicYear = ayMatch[1].replace(/\s+/g, "");
    confidence.academicYear = "high";
  }

  // 2. Semester (e.g. Semester 3, Sem: 3, Sem-3, 3rd Semester, Semester: III)
  const semMatch = textCorpus.match(/(?:semester|sem)[\s.:#-]*([1-8]|I|II|III|IV|V|VI|VII|VIII)/i);
  if (semMatch) {
    const romanMap: Record<string, number> = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
    };
    const val = semMatch[1].toUpperCase();
    semester = romanMap[val] || parseInt(val, 10) || undefined;
    if (semester) confidence.semester = "high";
  }

  // 3. Division (e.g. Division: 3B, Div - 3B, Section: B, Div: A)
  const divMatch = textCorpus.match(/(?:division|div|section|sec)[\s.:#-]*([0-9]?[A-Z][0-9]?)\b/i);
  if (divMatch) {
    division = divMatch[1].toUpperCase();
    confidence.division = "high";
  } else {
    // Fallback: look for 3B, 2A pattern in text
    const quickDiv = textCorpus.match(/\b([1-8][A-Z])\b/);
    if (quickDiv) {
      division = quickDiv[1].toUpperCase();
      confidence.division = "medium";
    }
  }

  // 4. Institute (e.g. SOE, School of Engineering, FoET, CSPIT, etc.)
  const instMatch = textCorpus.match(/\b(SOE|CSPIT|DEPSTAR|FOET|SOCA|IITE|ITM|SVNIT)\b/i);
  if (instMatch) {
    institute = instMatch[1].toUpperCase();
    confidence.institute = "high";
  } else if (textCorpus.match(/school\s+of\s+engineering/i)) {
    institute = "SOE";
    confidence.institute = "high";
  }

  // 5. Program (e.g. B.Tech, B.E., M.Tech, BCA, MCA, B.Sc)
  const progMatch = textCorpus.match(/\b(B\.?\s*Tech|B\.?\s*E|M\.?\s*Tech|BCA|MCA|B\.?\s*Sc)\b/i);
  if (progMatch) {
    program = progMatch[1].replace(/\s+/g, "").toUpperCase();
    if (program.includes("TECH")) program = "B.Tech";
    confidence.program = "high";
  }

  // 6. Branch (e.g. CSE, IT, ECE, ME, CE, Computer Science, Information Technology)
  const branchMatch = textCorpus.match(/\b(CSE|IT|ECE|EE|ME|CE|AI|DS|AIML|AIDS|CSBS)\b/i);
  if (branchMatch) {
    branch = branchMatch[1].toUpperCase();
    confidence.branch = "high";
  } else if (textCorpus.match(/computer\s+science/i)) {
    branch = "CSE";
    confidence.branch = "high";
  } else if (textCorpus.match(/information\s+technology/i)) {
    branch = "IT";
    confidence.branch = "high";
  }

  // 7. Attendance Period Dates
  // Patterns like "08/06/2026 to 31/08/2026" or "08-06-2026 To 31-08-2026" or "08 Jun 2026 - 31 Aug 2026"
  const dateRangeMatch = textCorpus.match(
    /(\d{1,2}[-/.](?:\d{1,2}|[a-zA-Z]{3})[-/.](?:\d{4}|\d{2}))\s*(?:to|-|–)\s*(\d{1,2}[-/.](?:\d{1,2}|[a-zA-Z]{3})[-/.](?:\d{4}|\d{2}))/i
  );

  if (dateRangeMatch) {
    try {
      const p1 = parseDateString(dateRangeMatch[1]);
      const p2 = parseDateString(dateRangeMatch[2]);
      if (p1 && p2) {
        periodStart = p1;
        periodEnd = p2;
        confidence.period = "high";
      }
    } catch {
      confidence.period = "low";
    }
  }

  return {
    institute,
    program,
    branch,
    division,
    semester,
    academicYear,
    periodStart,
    periodEnd,
    studentCount: 0,
    subjectCount: 0,
    confidence,
  };
}

function parseDateString(str: string): string | null {
  try {
    const cleaned = str.trim().replace(/\s+/g, " ");
    const parts = cleaned.split(/[-/.]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month: number;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;

      // Check if month is string (Jun, Aug, etc.)
      if (isNaN(parseInt(parts[1], 10))) {
        const monthNames = [
          "jan",
          "feb",
          "mar",
          "apr",
          "may",
          "jun",
          "jul",
          "aug",
          "sep",
          "oct",
          "nov",
          "dec",
        ];
        month = monthNames.indexOf(parts[1].toLowerCase().slice(0, 3)) + 1;
      } else {
        month = parseInt(parts[1], 10);
      }

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch {
    return null;
  }
  return null;
}
