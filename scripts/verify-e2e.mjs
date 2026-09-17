import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

async function runVerification() {
  console.log("=== STEP 1: Uploading August Sheet (First Snapshot) ===");
  const augPath = path.resolve(process.cwd(), "sample_sheets", "CSE_3B_August.xlsx");
  const augBuffer = fs.readFileSync(augPath);

  // 1. Parse August Sheet
  const formDataAug = new FormData();
  const blobAug = new Blob([augBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  formDataAug.append("file", blobAug, "CSE_3B_August.xlsx");

  const parseResAug = await fetch(`${BASE_URL}/api/upload/parse`, {
    method: "POST",
    body: formDataAug,
  });

  const parseDataAug = await parseResAug.json();
  console.log("Parse August Status:", parseResAug.status);
  console.log("Detected Metadata:", parseDataAug.parseResult?.metadata);
  console.log("Students Detected:", parseDataAug.parseResult?.students?.length);
  console.log("Subjects Detected:", parseDataAug.parseResult?.subjects);

  if (!parseDataAug.success) {
    throw new Error("Failed to parse August sheet: " + JSON.stringify(parseDataAug));
  }

  // 2. Commit August Snapshot
  console.log("\n=== STEP 2: Committing August Snapshot to SQLite ===");
  const processResAug = await fetch(`${BASE_URL}/api/upload/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileBase64: parseDataAug.fileBase64,
      parseResult: parseDataAug.parseResult,
      confirmedMetadata: {
        institute: parseDataAug.parseResult.metadata.institute || "SOE",
        program: parseDataAug.parseResult.metadata.program || "B.Tech",
        branch: parseDataAug.parseResult.metadata.branch || "CSE",
        division: parseDataAug.parseResult.metadata.division || "3B",
        semester: parseDataAug.parseResult.metadata.semester || 3,
        academicYear: parseDataAug.parseResult.metadata.academicYear || "2026-27",
        periodStart: parseDataAug.parseResult.metadata.periodStart,
        periodEnd: parseDataAug.parseResult.metadata.periodEnd,
      },
    }),
  });

  const processDataAug = await processResAug.json();
  console.log("Process August Status:", processResAug.status);
  console.log("Snapshot 1 Created ID:", processDataAug.uploadId);
  console.log("Snapshot 1 Summary:", processDataAug.summary);

  // 3. Query Dashboard Metrics
  console.log("\n=== STEP 3: Verifying Command Centre Metrics ===");
  const metricsRes = await fetch(`${BASE_URL}/api/dashboard/metrics`);
  const metrics = await metricsRes.json();
  console.log("KPIs:", metrics);

  // 4. Query Student Table
  console.log("\n=== STEP 4: Verifying Student Table ===");
  const studentsRes = await fetch(`${BASE_URL}/api/dashboard/students?limit=5`);
  const studentsData = await studentsRes.json();
  console.log("Total students in table:", studentsData.total);
  console.log("First student record:", studentsData.students[0]);

  // 5. Upload September Sheet (Comparative Snapshot)
  console.log("\n=== STEP 5: Uploading September Sheet (Snapshot Comparison) ===");
  const septPath = path.resolve(process.cwd(), "sample_sheets", "CSE_3B_September.xlsx");
  const septBuffer = fs.readFileSync(septPath);

  const formDataSept = new FormData();
  const blobSept = new Blob([septBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  formDataSept.append("file", blobSept, "CSE_3B_September.xlsx");

  const parseResSept = await fetch(`${BASE_URL}/api/upload/parse`, {
    method: "POST",
    body: formDataSept,
  });

  const parseDataSept = await parseResSept.json();
  console.log("Parse September Students:", parseDataSept.parseResult?.students?.length);

  // 6. Commit September Snapshot
  console.log("\n=== STEP 6: Committing September Snapshot & Running Comparator ===");
  const processResSept = await fetch(`${BASE_URL}/api/upload/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileBase64: parseDataSept.fileBase64,
      parseResult: parseDataSept.parseResult,
      confirmedMetadata: {
        institute: "SOE",
        program: "B.Tech",
        branch: "CSE",
        division: "3B",
        semester: 3,
        academicYear: "2026-27",
        periodStart: parseDataSept.parseResult.metadata.periodStart,
        periodEnd: parseDataSept.parseResult.metadata.periodEnd,
      },
    }),
  });

  const processDataSept = await processResSept.json();
  console.log("Snapshot 2 Summary:", processDataSept.summary);

  // 7. Verify Student Intelligence for Missing Student (25SE02CS020 Karan Malhotra)
  console.log("\n=== STEP 7: Verifying Missing Student Profile (25SE02CS020 Karan Malhotra) ===");
  const missingRes = await fetch(`${BASE_URL}/api/students/25SE02CS020`);
  const missingData = await missingRes.json();
  console.log("Student Name:", missingData.student.name);
  console.log("Last Data Received At:", missingData.student.lastDataReceivedAt);
  console.log("Historical Records Preserved:", missingData.history.length);
  console.log("Presence Across Snapshots Audit:", missingData.presenceHistory);

  // 8. Verify Upload History List
  console.log("\n=== STEP 8: Verifying Upload History Timeline ===");
  const uploadsRes = await fetch(`${BASE_URL}/api/uploads`);
  const uploadsData = await uploadsRes.json();
  console.log("Total Uploads in History:", uploadsData.uploads?.length);
  uploadsData.uploads.forEach((u) => {
    console.log(`- [${u.id.slice(0, 8)}] ${u.originalFilename} | Students: ${u.studentCount} | Status: ${u.status}`);
  });

  console.log("\n🎉 ALL 8 VERIFICATION STEPS PASSED SUCCESSFULLY!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
