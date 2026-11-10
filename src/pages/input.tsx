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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative flex flex-col gap-6 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-slate-800">Upload Files</h2>
          <button
            id="baseCodeDropdown"
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>Base code</span>{" "}
            <i className="fa-solid fa-chevron-down text-xs"></i>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          id="dropZone"
          className="border-2 border-dashed border-purple-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-purple-50/20 hover:bg-purple-50/45 transition-all relative"
        >
          <input
            type="file"
            ref={fileInputRef}
            id="fileInput"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30"
          />

          {/* Upload Prompt */}
          {!hasFile && (
            <div
              id="uploadPrompt"
              className="flex flex-col items-center w-full pointer-events-none"
            >
              <div className="flex items-center gap-3 mb-3 text-slate-400">
                <i className="fa-solid fa-folder-closed text-3xl text-purple-400"></i>
                <div className="w-[1px] h-8 bg-slate-200"></div>
                <i className="fa-solid fa-file-lines text-3xl text-purple-400"></i>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-4 text-center">
                Drag & drop documents, images, code files, folders, or zip files
                here
              </p>
              <button
                type="button"
                onClick={handleChangeFile}
                className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all pointer-events-auto z-40 cursor-pointer"
              >
                Upload files or folders
              </button>
              <p className="text-xs text-slate-400 mt-3 pointer-events-auto z-40">
                or use an{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  example folder
                </a>
              </p>
            </div>
          )}

          {/* File Info State */}
          {hasFile && (
            <div className="flex flex-col items-center w-full z-40">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-inner">
                <i className={`${fileIcon} text-xl`}></i>
              </div>
              <h4 className="text-slate-800 font-semibold text-sm truncate max-w-[300px] mb-1 text-center">
                {fileName}
              </h4>
              <p className="text-slate-400 text-xs mb-4">{fileSize}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleChangeFile}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Choose another
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span id="publishText">PUBLISH</span>
              <i
                id="publishSpinner"
                className="fa-solid fa-circle-notch fa-spin hidden"
              ></i>
            </button>

            <div
              id="progressContainer"
              className="hidden flex flex-col gap-1.5"
            >
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span id="progressStatusText">Scanning items...</span>
                <span id="progressPercent">0%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  id="progressBar"
                  className="bg-blue-600 h-full w-0 transition-all duration-300"
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}