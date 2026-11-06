import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaCloudArrowUp, FaFileCode, FaFileZipper, FaXmark,
  FaFolderTree, FaSpinner, FaTrashCan, FaMagnifyingGlass,
} from "react-icons/fa6";
import { formatSize, listZipFilesWithSize, type ExtractedEntry } from "../utils/zip";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: "file" | "zip" | "folder";
  path: string; // đường dẫn đầy đủ (đối với file zip/folder)
}

interface Props {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxSizeMB?: number;
}

export default function UploadDropzone({ files, onFilesChange, maxSizeMB = 100 }: Props) {
  const [zipLoading, setZipLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyZip, setOnlyZip] = useState(false);

  const addEntries = (entries: ExtractedEntry[], source: string, type: UploadedFile["type"]) => {
    const mapped: UploadedFile[] = entries.map((e) => ({
      id: `${source}::${e.path}`,
      name: e.name,
      size: e.size,
      type,
      path: e.path,
    }));
    onFilesChange([...files, ...mapped]);
  };

  const handleDrop = async (accepted: File[]) => {
    for (const f of accepted) {
      const lower = f.name.toLowerCase();
      if (lower.endsWith(".zip")) {
        setZipLoading(f.name);
        try {
          const entries = await listZipFilesWithSize(f);
          if (entries.length > 0) addEntries(entries, f.name, "zip");
          else addEntries([{ name: f.name, path: f.name, size: formatSize(f.size) }], f.name, "zip");
        } catch {
          addEntries([{ name: f.name, path: f.name, size: formatSize(f.size) }], f.name, "zip");
        } finally {
          setZipLoading(null);
        }
      } else {
        addEntries([{ name: f.name, path: f.name, size: formatSize(f.size) }], f.name, "file");
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    maxSize: maxSizeMB * 1024 * 1024,
    onDrop: handleDrop,
  });

  const removeOne = (id: string) => onFilesChange(files.filter((f) => f.id !== id));
  const clearAll = () => onFilesChange([]);

  const filtered = files.filter((f) => {
    if (onlyZip && f.type !== "zip") return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.path.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Nhóm hiển thị theo đường dẫn thư mục
  const groups: Record<string, UploadedFile[]> = {};
  for (const f of filtered) {
    const dir = f.path.includes("/") ? f.path.split("/").slice(0, -1).join("/") : "Thư mục gốc";
    (groups[dir] ??= []).push(f);
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center border border-dashed px-6 py-12 text-center transition-colors cursor-pointer
          ${isDragActive ? "border-stone-900 bg-stone-50" : "border-stone-300 bg-[#fbfbf9] hover:border-stone-400 hover:bg-white"}`}
        style={{ borderRadius: 10 }}
      >
        <input {...getInputProps()} />
        <div className="pointer-events-none flex flex-col items-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center bg-stone-900 text-white" style={{ borderRadius: 8 }}>
            {zipLoading ? <FaSpinner className="h-5 w-5 animate-spin" /> : <FaCloudArrowUp className="h-5 w-5" />}
          </div>
          <p className="text-sm font-semibold text-stone-800">
            {zipLoading ? `Đang giải nén ${zipLoading}...` : isDragActive ? "Thả file vào đây" : "Kéo & thả file vào đây"}
          </p>
          <p className="mt-1 text-[13px] text-stone-500">hoặc nhấn để chọn nhiều file / folder / file zip</p>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-stone-400">
            File zip được tách ngay tại trình duyệt và hiển thị theo từng file bên trong.
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm file theo tên..."
                className="w-full border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 focus:border-stone-900 focus:outline-none"
                style={{ borderRadius: 7 }}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-600" style={{ borderRadius: 7 }}>
              <input type="checkbox" checked={onlyZip} onChange={(e) => setOnlyZip(e.target.checked)} className="accent-stone-900" />
              Chỉ file từ zip
            </label>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <FaTrashCan /> Xóa tất cả
            </button>
            <span className="text-xs text-stone-500">{filtered.length}/{files.length} file</span>
          </div>

          {/* Danh sách file theo thư mục */}
          <div className="max-h-[420px] space-y-4 overflow-auto pr-1">
            {Object.entries(groups).map(([dir, items]) => (
              <div key={dir} className="border border-stone-200 bg-white" style={{ borderRadius: 8 }}>
                <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2">
                  <FaFolderTree className="text-stone-400" />
                  <span className="truncate text-xs font-semibold text-stone-700">{dir}/</span>
                  <span className="ml-auto border border-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-500" style={{ borderRadius: 999 }}>
                    {items.length} file
                  </span>
                </div>
                <ul className="divide-y divide-stone-100">
                  {items.map((f) => (
                    <li key={f.id} className="group flex items-center gap-3 px-3 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-stone-50 text-stone-500 ring-1 ring-stone-200" style={{ borderRadius: 7 }}>
                        {f.type === "zip" ? <FaFileZipper /> : <FaFileCode />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-stone-800">{f.name}</span>
                        <span className="block truncate text-[11px] text-stone-400">
                          {f.path} · {f.size}
                        </span>
                      </span>
                      <span className={`hidden shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:block ${
                        f.type === "zip" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"}`} style={{ borderRadius: 999 }}>
                        {f.type === "zip" ? "Zip" : "File"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Xóa ${f.name}`}
                        onClick={() => removeOne(f.id)}
                        className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <FaXmark />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
