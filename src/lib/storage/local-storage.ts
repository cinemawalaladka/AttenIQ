import fs from "fs";
import path from "path";

const BASE_STORAGE_DIR = path.resolve(process.cwd(), "storage", "attendance-uploads");

export interface StoredFileInfo {
  storagePath: string;
  relativePath: string;
  filename: string;
  sizeBytes: number;
}

export async function storeOriginalExcelFile(
  buffer: Buffer,
  originalFilename: string,
  academicYear: string = "2026-27",
  institute: string = "SOE",
  branch: string = "CSE",
  division: string = "3B"
): Promise<StoredFileInfo> {
  // Sanitize path segments
  const safeYear = academicYear.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeInst = institute.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeBranch = branch.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeDiv = division.replace(/[^a-zA-Z0-9_-]/g, "_");

  const targetDir = path.join(BASE_STORAGE_DIR, safeYear, safeInst, safeBranch, safeDiv);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate unique filename preserving original name + timestamp
  const timestamp = Date.now();
  const ext = path.extname(originalFilename) || ".xlsx";
  const baseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const storedFilename = `${baseName}_${timestamp}${ext}`;
  const fullPath = path.join(targetDir, storedFilename);

  await fs.promises.writeFile(fullPath, buffer);

  const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");

  return {
    storagePath: fullPath,
    relativePath,
    filename: storedFilename,
    sizeBytes: buffer.length,
  };
}

export function getOriginalFileStream(storagePath: string): fs.ReadStream {
  if (!fs.existsSync(storagePath)) {
    throw new Error(`Original file not found at path: ${storagePath}`);
  }
  return fs.createReadStream(storagePath);
}

const TEMP_STORAGE_DIR = path.resolve(process.cwd(), "storage", "temp-uploads");

export async function saveTempUpload(
  buffer: Buffer,
  tempId: string,
  originalFilename: string
): Promise<string> {
  if (!fs.existsSync(TEMP_STORAGE_DIR)) {
    fs.mkdirSync(TEMP_STORAGE_DIR, { recursive: true });
  }

  const safeId = tempId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = path.extname(originalFilename) || ".xlsx";
  const tempPath = path.join(TEMP_STORAGE_DIR, `${safeId}${ext}`);

  await fs.promises.writeFile(tempPath, buffer);
  return tempPath;
}

export async function getTempUpload(tempId: string): Promise<Buffer | null> {
  const safeId = tempId.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!fs.existsSync(TEMP_STORAGE_DIR)) return null;

  const files = await fs.promises.readdir(TEMP_STORAGE_DIR);
  const matchingFile = files.find((f) => f.startsWith(safeId));
  if (!matchingFile) return null;

  const fullPath = path.join(TEMP_STORAGE_DIR, matchingFile);
  return await fs.promises.readFile(fullPath);
}

export async function cleanupTempUpload(tempId: string): Promise<void> {
  try {
    const safeId = tempId.replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!fs.existsSync(TEMP_STORAGE_DIR)) return;

    const files = await fs.promises.readdir(TEMP_STORAGE_DIR);
    const matchingFiles = files.filter((f) => f.startsWith(safeId));
    for (const f of matchingFiles) {
      await fs.promises.unlink(path.join(TEMP_STORAGE_DIR, f));
    }
  } catch {
    // Non-critical cleanup
  }
}
