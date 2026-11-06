import JSZip from "jszip";

export interface ExtractedEntry {
  name: string;
  path: string;
  size: string;
}

const CODE_EXTS = [".c", ".cc", ".cpp", ".h", ".hpp", ".py", ".java", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".cs"];

export const isCodeFile = (name: string) =>
  CODE_EXTS.some((ext) => name.toLowerCase().endsWith(ext));

export const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B`
  : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB`
  : `${(bytes / 1048576).toFixed(1)} MB`;

/** Đọc file zip và liệt kê các file code bên trong (đệ quy theo folder) */
export async function listZipFiles(file: File): Promise<ExtractedEntry[]> {
  const zip = await JSZip.loadAsync(file);
  const entries: ExtractedEntry[] = [];
  zip.forEach((relativePath, entry) => {
    if (entry.dir) return;
    if (!isCodeFile(relativePath)) return;
    const base = relativePath.split("/").pop() ?? relativePath;
    entries.push({ name: base, path: relativePath, size: "" });
  });
  return entries;
}

export async function listZipFilesWithSize(file: File): Promise<ExtractedEntry[]> {
  const zip = await JSZip.loadAsync(file);
  const entries: ExtractedEntry[] = [];
  const files = Object.values(zip.files).filter((f) => !f.dir && isCodeFile(f.name));
  for (const f of files) {
    const data = await f.async("uint8array");
    entries.push({ name: f.name.split("/").pop() ?? f.name, path: f.name, size: formatSize(data.length) });
  }
  return entries;
}
