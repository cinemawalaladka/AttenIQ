import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const filePath = path.resolve(process.cwd(), "sample_sheets", "CSE_3B_August.xlsx");
const buffer = fs.readFileSync(filePath);

console.log("Testing read of:", filePath, "Size:", buffer.length);

const workbook = XLSX.read(buffer, { type: "buffer" });
console.log("Sheet names:", workbook.SheetNames);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("Total raw rows:", rows.length);
console.log("Row 0:", rows[0]);
console.log("Row 1:", rows[1]);
console.log("Row 2:", rows[2]);
console.log("Row 4 (Headers):", rows[4]);
console.log("Row 5 (First student):", rows[5]);
