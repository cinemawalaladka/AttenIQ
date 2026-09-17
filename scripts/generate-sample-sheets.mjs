import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve(process.cwd(), "sample_sheets");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1. Generate August Sheet (58 students)
function generateAugustSheet() {
  const wsData = [
    ["School of Engineering (SOE) - Department of Computer Science & Engineering"],
    ["Attendance Record: B.Tech CSE - Division 3B (Semester 3) - Academic Year: 2026-27"],
    ["Attendance Period: 08-06-2026 to 31-08-2026"],
    [],
    [
      "Roll No",
      "Enrollment Number",
      "Student Name",
      "Data Structures (C)",
      "Data Structures (P)",
      "Data Structures (%)",
      "DBMS (C)",
      "DBMS (P)",
      "DBMS (%)",
      "Digital Logic (C)",
      "Digital Logic (P)",
      "Digital Logic (%)",
      "Total Conducted",
      "Total Present",
      "Total Attendance %",
    ],
  ];

  const studentNames = [
    "Aarav Sharma", "Aditi Patel", "Akash Verma", "Ananya Iyer", "Aniket Deshmukh",
    "Aryan Gupta", "Bhavya Shah", "Chirag Joshi", "Deepak Mehta", "Devendra Singh",
    "Dhruv Trivedi", "Divya Nair", "Esha Malhotra", "Gaurav Choudhary", "Hardik Pandya",
    "Harsh Vardhan", "Ishaan Roy", "Ishita Saxena", "Jayesh Patel", "Karan Malhotra",
    "Kavya Reddy", "Krunal Bhatt", "Lakshya Sen", "Manav Kapadia", "Manish Mishra",
    "Mayank Agarwal", "Meera Pillai", "Mohit Kumar", "Nandini Rao", "Naveen Nambiar",
    "Neha Dubey", "Nikhil Sethi", "Nirav Parekh", "Palak Gandhi", "Pooja Hegde",
    "Pranav Mohan", "Prashant Yadav", "Priya Kulkarni", "Rahul Sen", "Riya Sen",
    "Rohan Mukherjee", "Rohit Bhardwaj", "Ruchir Dave", "Sahil Bansal", "Sakshi Tanwar",
    "Sameer Shaikh", "Sanjay Dutt", "Sarthak Jain", "Shreya Ghoshal", "Siddharth Shukla",
    "Sneha Paul", "Sourabh Tiwary", "Tanmay Bhat", "Tarun Khanna", "Urvashi Rautela",
    "Vaibhav Suryavanshi", "Varun Dhawan", "Yashasvi Jaiswal"
  ];

  studentNames.forEach((name, idx) => {
    const roll = idx + 1;
    const enroll = `25SE02CS${String(roll).padStart(3, "0")}`;

    // Vary attendance between 55% and 98%
    const dsC = 30;
    const dbmsC = 28;
    const dlC = 26;
    const totalC = dsC + dbmsC + dlC;

    // Seed realistic attendance pattern
    let factor = 0.85;
    if (idx < 5) factor = 0.58; // Below 60%
    else if (idx < 12) factor = 0.68; // 60-74%
    else if (idx > 48) factor = 0.94; // Above 90%
    else factor = 0.78 + (idx % 10) * 0.015;

    const dsP = Math.round(dsC * factor);
    const dbmsP = Math.round(dbmsC * factor);
    const dlP = Math.round(dlC * factor);
    const totalP = dsP + dbmsP + dlP;
    const totalPct = Number(((totalP / totalC) * 100).toFixed(2));

    wsData.push([
      roll,
      enroll,
      name,
      dsC,
      dsP,
      Number(((dsP / dsC) * 100).toFixed(2)),
      dbmsC,
      dbmsP,
      Number(((dbmsP / dbmsC) * 100).toFixed(2)),
      dlC,
      dlP,
      Number(((dlP / dlC) * 100).toFixed(2)),
      totalC,
      totalP,
      totalPct,
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Attendance_August");
  const filePath = path.join(OUT_DIR, "CSE_3B_August.xlsx");
  XLSX.writeFile(wb, filePath);
  console.log("Created:", filePath);
  return studentNames;
}

// 2. Generate September Sheet (57 students: 1 missing, 1 new)
function generateSeptemberSheet(augustStudents) {
  const wsData = [
    ["School of Engineering (SOE) - Department of Computer Science & Engineering"],
    ["Attendance Record: B.Tech CSE - Division 3B (Semester 3) - Academic Year: 2026-27"],
    ["Attendance Period: 01-09-2026 to 30-09-2026"],
    [],
    [
      "Roll No",
      "Enrollment Number",
      "Student Name",
      "Data Structures (C)",
      "Data Structures (P)",
      "Data Structures (%)",
      "DBMS (C)",
      "DBMS (P)",
      "DBMS (%)",
      "Digital Logic (C)",
      "Digital Logic (P)",
      "Digital Logic (%)",
      "Total Conducted",
      "Total Present",
      "Total Attendance %",
    ],
  ];

  // Remove Karan Malhotra (index 19, 25SE02CS020) to demonstrate missing student detection
  const filtered = augustStudents.filter((_, idx) => idx !== 19);

  // Add 1 new student (Zaid Khan) to demonstrate new student detection
  filtered.push("Zaid Khan");

  filtered.forEach((name, idx) => {
    const roll = idx + 1;
    let enroll = "";
    if (name === "Zaid Khan") {
      enroll = "25SE02CS099"; // New student enrollment
    } else {
      const origIdx = augustStudents.indexOf(name);
      enroll = `25SE02CS${String(origIdx + 1).padStart(3, "0")}`;
    }

    const dsC = 32;
    const dbmsC = 30;
    const dlC = 28;
    const totalC = dsC + dbmsC + dlC;

    let factor = 0.82;
    if (idx < 4) factor = 0.55;
    else if (idx < 10) factor = 0.70;
    else if (idx > 45) factor = 0.92;
    else factor = 0.75 + (idx % 10) * 0.015;

    const dsP = Math.round(dsC * factor);
    const dbmsP = Math.round(dbmsC * factor);
    const dlP = Math.round(dlC * factor);
    const totalP = dsP + dbmsP + dlP;
    const totalPct = Number(((totalP / totalC) * 100).toFixed(2));

    wsData.push([
      roll,
      enroll,
      name,
      dsC,
      dsP,
      Number(((dsP / dsC) * 100).toFixed(2)),
      dbmsC,
      dbmsP,
      Number(((dbmsP / dbmsC) * 100).toFixed(2)),
      dlC,
      dlP,
      Number(((dlP / dlC) * 100).toFixed(2)),
      totalC,
      totalP,
      totalPct,
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Attendance_September");
  const filePath = path.join(OUT_DIR, "CSE_3B_September.xlsx");
  XLSX.writeFile(wb, filePath);
  console.log("Created:", filePath);
}

const augStudents = generateAugustSheet();
generateSeptemberSheet(augStudents);
console.log("Sample attendance sheets generated successfully in ./sample_sheets/");
