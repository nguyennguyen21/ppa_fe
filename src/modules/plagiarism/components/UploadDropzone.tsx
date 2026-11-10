import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDropzone } from "react-dropzone";
import {
  FaCloudArrowUp, FaFileCode, FaFileZipper, FaXmark,
  FaFolderTree, FaSpinner, FaTrashCan, FaMagnifyingGlass, FaEye,
} from "react-icons/fa6";
import { formatSize, listZipFilesWithSize } from "../utils/zip";
import { useConfirm } from "../../lib/Components/UI/feedback/ConfirmDialog";
import { useToast } from "../../lib/Components/UI/feedback/Toast";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: "file" | "zip" | "folder";
  path: string; // đường dẫn đầy đủ (đối với file zip/folder)
  /** Nội dung đã đọc sẵn để xem trước và xử lý khi quét. */
  text?: string;
}

interface Props {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxSizeMB?: number;
}

const MAX_PREVIEW_CHARS = 600_000;

export default function UploadDropzone({ files, onFilesChange, maxSizeMB = 100 }: Props) {
  const [zipLoading, setZipLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyZip, setOnlyZip] = useState(false);
  const [preview, setPreview] = useState<UploadedFile | null>(null);
  const confirm = useConfirm();
  const toast = useToast();

  useEffect(() => {
    if (!preview) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [preview]);

  const handleDrop = async (accepted: File[]) => {
    const collected: UploadedFile[] = [];

    for (const f of accepted) {
      const lower = f.name.toLowerCase();
      if (lower.endsWith(".zip")) {
        setZipLoading(f.name);
        try {
          const entries = await listZipFilesWithSize(f);
          if (entries.length > 0) {
            collected.push(
              ...entries.map((entry) => ({
                id: `${f.name}::${entry.path}`,
                name: entry.name,
                size: entry.size,
                type: "zip" as const,
                path: entry.path,
                text: entry.text?.slice(0, MAX_PREVIEW_CHARS),
              })),
            );
            toast.success(`Đã tách ${entries.length} file từ ${f.name}`);
          } else {
            collected.push({ id: `${f.name}::${f.name}`, name: f.name, size: formatSize(f.size), type: "zip", path: f.name });
            toast.info("Không tìm thấy file mã nguồn trong zip", "Zip vẫn được giữ để bạn kiểm tra lại.");
          }
        } catch {
          collected.push({ id: `${f.name}::${f.name}`, name: f.name, size: formatSize(f.size), type: "zip", path: f.name });
          toast.error("Không đọc được file zip", "File có thể bị hỏng hoặc dùng định dạng nén không hỗ trợ.");
        } finally {
          setZipLoading(null);
        }
      } else {
        const text = await f.text().catch(() => "");
        collected.push({
          id: `${f.name}::${f.name}`,
          name: f.name,
          size: formatSize(f.size),
          type: "file",
          path: f.name,
          text: text.slice(0, MAX_PREVIEW_CHARS),
        });
      }
    }

    if (collected.length === 0) return;
    const merged = new Map(files.map((item) => [item.id, item]));
    for (const item of collected) merged.set(item.id, item);
    onFilesChange([...merged.values()]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    maxSize: maxSizeMB * 1024 * 1024,
    onDrop: handleDrop,
    onDropRejected: (rejections) => {
      const first = rejections[0];
      toast.error(
        "Không nhận được file",
        first ? `${first.file.name} vượt quá ${maxSizeMB} MB hoặc sai định dạng.` : undefined,
      );
    },
  });

  const removeOne = async (file: UploadedFile) => {
    const ok = await confirm({
      title: `Xoá ${file.name}?`,
      description: "File này sẽ bị bỏ khỏi danh sách chờ quét.",
      confirmLabel: "Xoá file",
      tone: "danger",
    });
    if (!ok) return;
    onFilesChange(files.filter((f) => f.id !== file.id));
    toast.info("Đã xoá file", file.name);
  };

  const clearAll = async () => {
    const ok = await confirm({
      title: `Xoá toàn bộ ${files.length} file?`,
      description: "Danh sách chờ quét sẽ trống. Bạn có thể chọn lại file sau.",
      confirmLabel: "Xoá tất cả",
      tone: "danger",
    });
    if (!ok) return;
    onFilesChange([]);
    toast.info("Đã xoá danh sách file");
  };

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

  const previewLines = preview?.text
    ? preview.text.replace(/\r\n?/g, "\n").split("\n")
    : [];
  const shownLines = previewLines.slice(0, 120);

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-12 text-center transition-colors
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
          <p className="mt-1 text-[13px] text-stone-600">hoặc nhấn để chọn nhiều file / folder / file zip</p>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-stone-600">
            File zip được tách ngay tại trình duyệt và hiển thị theo từng file bên trong.
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm file theo tên..."
                className="w-full border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 focus:border-stone-900 focus:outline-none"
                style={{ borderRadius: 7 }}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700" style={{ borderRadius: 7 }}>
              <input type="checkbox" checked={onlyZip} onChange={(e) => setOnlyZip(e.target.checked)} className="accent-stone-900" />
              Chỉ file từ zip
            </label>
            <button
              type="button"
              onClick={clearAll}
              data-guide="upload-clear"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <FaTrashCan /> Xóa tất cả
            </button>
            <span className="text-xs text-stone-600">{filtered.length}/{files.length} file</span>
          </div>

          {/* Danh sách file theo thư mục */}
          <div className="max-h-[420px] space-y-4 overflow-auto pr-1">
            {Object.entries(groups).map(([dir, items]) => (
              <div key={dir} className="border border-stone-200 bg-white" style={{ borderRadius: 8 }}>
                <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2">
                  <FaFolderTree className="text-stone-600" />
                  <span className="truncate text-xs font-semibold text-stone-700">{dir}/</span>
                  <span className="ml-auto border border-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600" style={{ borderRadius: 999 }}>
                    {items.length} file
                  </span>
                </div>
                <ul className="divide-y divide-stone-100">
                  {items.map((f) => (
                    <li key={f.id} className="group flex items-center gap-3 px-3 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-stone-50 text-stone-600 ring-1 ring-stone-200" style={{ borderRadius: 7 }}>
                        {f.type === "zip" ? <FaFileZipper /> : <FaFileCode />}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreview(f)}
                        className="min-w-0 flex-1 text-left"
                        title={`Xem trước ${f.name}`}
                      >
                        <span className="block truncate text-sm font-medium text-stone-800 group-hover:underline">{f.name}</span>
                        <span className="block truncate text-xs text-stone-600">
                          {f.path} · {f.size}
                        </span>
                      </button>
                      <span className={`hidden shrink-0 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide sm:block ${
                        f.type === "zip" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`} style={{ borderRadius: 999 }}>
                        {f.type === "zip" ? "Zip" : "File"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Xem trước ${f.name}`}
                        data-guide="upload-preview"
                        onClick={() => setPreview(f)}
                        className="shrink-0 rounded-md p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                      >
                        <FaEye size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Xóa ${f.name}`}
                        onClick={() => void removeOne(f)}
                        className="shrink-0 rounded-md p-1.5 text-stone-600 hover:bg-red-50 hover:text-red-600"
                      >
                        <FaXmark size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Đóng xem trước"
              onClick={() => setPreview(null)}
              className="absolute inset-0 cursor-default bg-stone-950/45 backdrop-blur-sm"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Xem trước ${preview.name}`}
              className="modal-in relative flex max-h-[85vh] w-full max-w-3xl flex-col border border-stone-200 bg-white shadow-2xl"
              style={{ borderRadius: 12 }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg font-semibold text-stone-900">{preview.name}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-600">
                    {preview.path} · {preview.size} · {preview.type === "zip" ? "từ file zip" : "file trực tiếp"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  aria-label="Đóng xem trước"
                  className="rounded-md p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                >
                  <FaXmark size={13} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-[#fbfbfa] p-4">
                {shownLines.length > 0 ? (
                  <>
                    <pre className="font-mono text-xs leading-relaxed text-stone-800">
                      {shownLines.map((line, index) => (
                        <span key={index} className="flex">
                          <span className="mr-3 w-8 shrink-0 select-none text-right text-stone-500">{index + 1}</span>
                          <span className="whitespace-pre">{line || " "}</span>
                        </span>
                      ))}
                    </pre>
                    {previewLines.length > shownLines.length && (
                      <p className="mt-3 text-center text-xs text-stone-600">
                        Còn {previewLines.length - shownLines.length} dòng nữa — chỉ hiển thị 120 dòng đầu.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="py-10 text-center text-sm text-stone-600">
                    Không có nội dung văn bản để xem trước. File vẫn có thể được quét nếu là mã nguồn hợp lệ.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
