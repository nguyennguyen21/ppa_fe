import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaCheck, FaSpinner } from "react-icons/fa6";
import UploadDropzone, { type UploadedFile } from "../modules/plagiarism/components/UploadDropzone";
import { languages } from "../data/mock";

const steps = ["Chọn file", "Cấu hình", "Đang quét", "Hoàn tất"];

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [language, setLanguage] = useState("c");
  const [threshold, setThreshold] = useState(40);
  const [excludeComments, setExcludeComments] = useState(true);
  const [normalizeAST, setNormalizeAST] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    setStep(2);
    let p = 0;
    const iv = window.setInterval(() => {
      p += Math.random() * 14;
      if (p >= 100) {
        window.clearInterval(iv);
        setScanning(false);
        setStep(3);
        window.setTimeout(() => navigate("/results"), 1000);
      } else {
        setProgress(Math.floor(p));
      }
    }, 340);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">CODEX / Bài nộp</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">Nạp bài nộp để quét</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Có thể nạp nhiều file code, cả thư mục hoặc file zip. Hệ thống tự tách nội dung zip
          thành danh sách file riêng, giữ nguyên đường dẫn để dễ rà soát.
        </p>
      </div>

      {/* Steps */}
      <ol className="flex items-center gap-3">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                i < step
                  ? "border-stone-900 bg-stone-900 text-white"
                  : i === step
                    ? "border-stone-900 bg-white text-stone-900"
                    : "border-stone-300 bg-white text-stone-400"
              }`}
            >
              {i < step ? <FaCheck className="h-3 w-3" /> : i + 1}
            </span>
            <span className={`hidden text-[13px] font-medium sm:block ${i === step ? "text-stone-900" : "text-stone-400"}`}>{s}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px flex-1 bg-stone-200" />}
          </li>
        ))}
      </ol>

      <section className="border border-stone-200 bg-white p-5 sm:p-8" style={{ borderRadius: 10 }}>
        {step === 0 && (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Chọn file</h2>
                <p className="mt-1 text-sm text-stone-500">Kéo thả vào ô bên dưới, hoặc nhấn để duyệt từ máy.</p>
              </div>
              <p className="text-xs text-stone-500">.c .cpp .py .java .js .ts .zip · tối đa 100 MB</p>
            </div>
            <UploadDropzone files={files} onFilesChange={setFiles} />
            <div className="mt-7 flex items-center justify-between border-t border-stone-100 pt-5">
              <p className="text-xs text-stone-500">{files.length ? `Đã có ${files.length} file sẵn sàng` : "Chưa chọn file nào"}</p>
              <button
                disabled={files.length === 0}
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tiếp tục <FaArrowRight className="text-xs" />
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-base font-semibold text-stone-900">Cấu hình quét</h2>
            <p className="mt-1 text-sm text-stone-500">Giữ các thiết lập mặc định nếu không chắc chắn.</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-stone-700">Ngôn ngữ</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-stone-900 focus:outline-none"
                >
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-stone-700">
                  Ngưỡng cảnh báo: <span className="font-semibold text-stone-900">{threshold}%</span>
                </span>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-stone-900"
                />
                <span className="text-xs text-stone-500">Vượt ngưỡng thì bài nộp được gắn nhãn cần xem lại.</span>
              </div>
            </div>

            <div className="mt-6 divide-y divide-stone-100 border border-stone-200" style={{ borderRadius: 8 }}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={excludeComments}
                  onChange={(e) => setExcludeComments(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900"
                />
                <span>
                  <span className="block text-sm font-medium text-stone-800">Bỏ qua comment và khoảng trắng</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
                    Giảm nhiễu khi hai bài dùng cùng cấu trúc nhưng khác chú thích.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={normalizeAST}
                  onChange={(e) => setNormalizeAST(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900"
                />
                <span>
                  <span className="block text-sm font-medium text-stone-800">Chuẩn hóa tên biến và hàm</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
                    So sánh theo cấu trúc AST nên đổi tên biến vẫn có thể nhận ra.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-5 bg-stone-50 px-4 py-3 text-sm text-stone-600" style={{ borderRadius: 8 }}>
              Đã chọn <strong className="font-semibold text-stone-900">{files.length} file</strong> ·{" "}
              {languages.find((l) => l.id === language)?.label} · Ngưỡng{" "}
              <strong className="font-semibold text-stone-900">{threshold}%</strong>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-stone-100 pt-5">
              <button
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <FaArrowLeft className="text-xs" /> Quay lại
              </button>
              <button
                onClick={startScan}
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
              >
                {scanning ? <FaSpinner className="animate-spin" /> : null} Bắt đầu quét
              </button>
            </div>
          </>
        )}

        {step >= 2 && (
          <div className="py-10 text-center">
            {scanning ? (
              <>
                <FaSpinner className="mx-auto h-8 w-8 animate-spin text-stone-700" />
                <h2 className="mt-4 text-base font-semibold text-stone-900">Đang quét {files.length} bài nộp</h2>
                <p className="mt-1 text-sm text-stone-500">Phân tích cấu trúc và tính mức tương đồng.</p>
                <div className="mx-auto mt-6 h-1.5 w-full max-w-sm overflow-hidden bg-stone-100" style={{ borderRadius: 999 }}>
                  <div className="h-full bg-stone-900 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-sm font-medium text-stone-600">{progress}%</p>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <FaCheck className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-stone-900">Đã quét xong</h2>
                <p className="mt-1 text-sm text-stone-500">Đang mở trang kết quả…</p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
