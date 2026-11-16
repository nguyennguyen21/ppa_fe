import { useState, useRef, type ChangeEvent } from "react";

export default function InputPage() {
  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileIcon, setFileIcon] = useState("fa-solid fa-folder-tree");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const getFileIcon = (name: string): string => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["zip", "rar", "7z"].includes(ext)) return "fa-solid fa-file-zipper";
    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext))
      return "fa-solid fa-image";
    if (["js", "jsx", "ts", "tsx", "py", "html", "css", "json"].includes(ext))
      return "fa-solid fa-code";
    if (["pdf", "doc", "docx", "txt", "md"].includes(ext))
      return "fa-solid fa-file-lines";
    return "fa-solid fa-folder-tree";
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(formatSize(file.size));
      setFileIcon(getFileIcon(file.name));
      setHasFile(true);
    }
  };

  const handleRemove = () => {
    setHasFile(false);
    setFileName("");
    setFileSize("");
    setFileIcon("fa-solid fa-folder-tree");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChangeFile = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-[2px]">
      <div className="relative flex w-full max-w-lg flex-col gap-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h2 className="text-lg font-bold text-stone-900">Upload Files</h2>
          <button
            id="baseCodeDropdown"
            type="button"
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50"
          >
            <span>Base code</span>{" "}
            <i className="fa-solid fa-chevron-down text-xs"></i>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          id="dropZone"
          className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/30 p-8 transition-all hover:bg-amber-50/50"
        >
          <input
            type="file"
            ref={fileInputRef}
            id="fileInput"
            onChange={handleFileChange}
            className="absolute inset-0 z-30 h-full w-full cursor-pointer opacity-0"
          />

          {/* Upload Prompt */}
          {!hasFile && (
            <div
              id="uploadPrompt"
              className="pointer-events-none flex w-full flex-col items-center"
            >
              <div className="mb-3 flex items-center gap-3 text-stone-400">
                <i className="fa-solid fa-folder-closed text-3xl text-amber-500"></i>
                <div className="h-8 w-[1px] bg-stone-200"></div>
                <i className="fa-solid fa-file-lines text-3xl text-amber-500"></i>
              </div>
              <p className="mb-4 text-center text-sm font-medium text-stone-500">
                Drag & drop documents, images, code files, folders, or zip files
                here
              </p>
              <button
                type="button"
                onClick={handleChangeFile}
                className="pointer-events-auto z-40 cursor-pointer rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md active:scale-95"
              >
                Upload files or folders
              </button>
              <p className="pointer-events-auto z-40 mt-3 text-xs text-stone-400">
                or use an{" "}
                <a href="#" className="text-amber-600 hover:underline">
                  example folder
                </a>
              </p>
            </div>
          )}

          {/* File Info State */}
          {hasFile && (
            <div className="z-40 flex w-full flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-inner">
                <i className={`${fileIcon} text-xl`}></i>
              </div>
              <h4 className="mb-1 max-w-[300px] truncate text-center text-sm font-semibold text-stone-900">
                {fileName}
              </h4>
              <p className="mb-4 text-xs text-stone-400">{fileSize}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleChangeFile}
                  className="cursor-pointer rounded-lg bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-700 transition-all hover:bg-stone-200"
                >
                  Choose another
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="cursor-pointer rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Publish Button - CHỈ HIỆN KHI CÓ FILE */}
        {hasFile && (
          <div className="flex flex-col gap-3">
            <button
              id="publishBtn"
              type="button"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-sm font-bold tracking-wide text-white shadow-sm transition-all active:scale-[0.98] hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md"
            >
              <span id="publishText">PUBLISH</span>
              <i
                id="publishSpinner"
                className="fa-solid fa-circle-notch fa-spin hidden"
              ></i>
            </button>

            <div
              id="progressContainer"
              className="hidden flex-col gap-1.5"
            >
              <div className="flex justify-between text-xs font-medium text-stone-500">
                <span id="progressStatusText">Scanning items...</span>
                <span id="progressPercent">0%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  id="progressBar"
                  className="h-full w-0 bg-stone-900 transition-all duration-300"
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}