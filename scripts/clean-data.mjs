import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function cleanData() {
  console.log("🧹 Starting AttendIQ data cleanup...");

  try {
    // 1. Delete records in correct relational cascade order
    console.log("Deleting AttendanceSubjectRecords...");
    await prisma.attendanceSubjectRecord.deleteMany();

    console.log("Deleting AttendanceRecords...");
    await prisma.attendanceRecord.deleteMany();

    console.log("Deleting StudentSnapshotPresences...");
    await prisma.studentSnapshotPresence.deleteMany();

    console.log("Deleting Uploads...");
    await prisma.upload.deleteMany();

    console.log("Deleting Students...");
    await prisma.student.deleteMany();

    console.log("Deleting Subjects...");
    await prisma.subject.deleteMany();

    console.log("Deleting Divisions...");
    await prisma.division.deleteMany();

    console.log("Deleting Branches...");
    await prisma.branch.deleteMany();

    console.log("Deleting Programs...");
    await prisma.program.deleteMany();

    console.log("Deleting Institutes...");
    await prisma.institute.deleteMany();

    console.log("✅ Database tables cleared successfully.");

    // 2. Clean storage directory
    const storageDir = path.resolve(process.cwd(), "storage", "attendance-uploads");
    if (fs.existsSync(storageDir)) {
      console.log(`Cleaning upload storage files in: ${storageDir}`);
      fs.rmSync(storageDir, { recursive: true, force: true });
      fs.mkdirSync(storageDir, { recursive: true });
      console.log("✅ Storage directory cleaned and re-created.");
    }

    console.log("\n✨ All dummy and test data has been completely wiped!");
    console.log("AttendIQ is now in a fresh, pristine state ready for sheet uploads.");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();
