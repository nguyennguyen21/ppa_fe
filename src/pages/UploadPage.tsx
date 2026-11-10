import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaCheck, FaSpinner, FaStop } from "react-icons/fa6";
import UploadDropzone, { type UploadedFile } from "../modules/plagiarism/components/UploadDropzone";
import { useBackendData } from "../modules/lib/hook/backend-data-context";
import { useToast } from "../modules/lib/Components/UI/feedback/Toast";
import { useConfirm } from "../modules/lib/Components/UI/feedback/ConfirmDialog";

// Các bước quét: chọn file → đang quét → hoàn tất (không còn bước cấu hình)
const steps = ["Chọn file", "Đang quét", "Hoàn tất"];

export default function UploadPage() {
  const navigate = useNavigate();
  const toast = useToast();
  // Luồng quét THẬT: upload file lên backend → phát hiện clone → tính tương đồng.
  const { uploadAndScan } = useBackendData();
  const confirm = useConfirm();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const canceledRef = useRef(false);

  useEffect(() => {
    return () => {
      // Rời trang giữa chừng thì dừng vòng quét.
      canceledRef.current = true;
    };
  }, []);

  const startScan = async () => {
    if (files.length === 0) return;
    const ok = await confirm({
      title: `Bắt đầu quét ${files.length} file?`,
      description: "Ngôn ngữ tự nhận theo phần mở rộng của file. Bạn có thể huỷ giữa chừng.",
      confirmLabel: "Bắt đầu quét",
    });
    if (!ok) return;

    canceledRef.current = false;
    setScanning(true);
    setProgress(0);
    setProcessed(0);
    setEta(null);
    setStep(1);

    const total = files.length;
    const startedAt = performance.now();

    try {
      // Gọi backend THẬT: upload từng file → detect-token-clones → calculate → load kết quả.
      const outcome = await uploadAndScan(
        files.map((file) => ({ name: file.name, text: file.text })),
        // Không còn phần cấu hình: ngôn ngữ của mỗi file do backend nhận theo tên file.
        "",
        {
          onProgress: (done) => {
            const elapsed = (performance.now() - startedAt) / 1000;
            const rate = done / Math.max(elapsed, 0.05);
            const remaining = Math.max(0, Math.round((total - done) / Math.max(rate, 0.1)));
            setProcessed(done);
            setProgress(Math.round((done / total) * 100));
            setEta(remaining);
          },
          shouldContinue: () => !canceledRef.current,
        },
      );

      if (outcome.canceled) {
        setScanning(false);
        setProgress(0);
        setProcessed(0);
        setEta(null);
        setStep(0);
        toast.info("Đã huỷ đợt quét", "Các file đã chọn vẫn được giữ nguyên.");
        return;
      }

      const failed = outcome.results.filter((r) => (r.status ?? "").toLowerCase() !== "ok" && (r.status ?? "").toLowerCase() !== "success");
      if (failed.length > 0) {
        toast.error(
          `Không xử lý được ${failed.length} file`,
          failed.map((r) => r.fileName ?? "?").slice(0, 5).join(", "),
        );
      }
    } catch (exception) {
      setScanning(false);
      setStep(0);
      toast.error(
        "Quét thất bại",
        `Không gọi được backend: ${exception instanceof Error ? exception.message : String(exception)}`,
      );
      return;
    }

    setScanning(false);
    setStep(2);
    setEta(0);
    toast.success(`Đã quét xong ${total} file`, "Đang mở trang kết quả…");
    window.setTimeout(() => navigate("/results"), 900);
  };

  const cancelScan = async () => {
    const ok = await confirm({
      title: "Huỷ đợt quét?",
      description: "Tiến trình hiện tại sẽ dừng lại. Bạn có thể bắt đầu lại từ trang này.",
      confirmLabel: "Huỷ quét",
      cancelLabel: "Tiếp tục quét",
      tone: "danger",
    });
    if (ok) canceledRef.current = true;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">CODEX / Bài nộp</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">Nạp bài nộp để quét</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Có thể nạp nhiều file code, cả thư mục hoặc file zip. Hệ thống tự tách nội dung zip
          thành danh sách file riêng, giữ nguyên đường dẫn để dễ rà soát.
        </p>
      </div>

      {/* Steps */}
      <ol className="flex items-center gap-3">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                i < step
                  ? "border-stone-900 bg-stone-900 text-white"
                  : i === step
                    ? "border-stone-900 bg-white text-stone-900"
                    : "border-stone-300 bg-white text-stone-500"
              }`}
            >
              {i < step ? <FaCheck className="h-3 w-3" /> : i + 1}
            </span>
            <span className={`hidden text-[13px] font-medium sm:block ${i === step ? "text-stone-900" : "text-stone-500"}`}>{s}</span>
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
                <p className="mt-1 text-sm text-stone-600">Kéo thả vào ô bên dưới, hoặc nhấn để duyệt từ máy.</p>
              </div>
              <p className="text-xs text-stone-600">.c .cpp .py .java .js .ts .zip · tối đa 100 MB</p>
            </div>
            <UploadDropzone files={files} onFilesChange={setFiles} />
            <div className="mt-7 flex items-center justify-between border-t border-stone-100 pt-5">
              <p className="text-xs text-stone-600">{files.length ? `Đã có ${files.length} file sẵn sàng` : "Chưa chọn file nào"}</p>
              <button
                disabled={files.length === 0 || scanning}
                onClick={() => void startScan()}
                data-guide="upload-continue"
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tiếp tục <FaArrowRight className="text-xs" />
              </button>
            </div>
          </>
        )}

        {step >= 1 && (
          <div className="py-10 text-center">
            {scanning ? (
              <>
                <FaSpinner className="mx-auto h-8 w-8 animate-spin text-stone-700" />
                <h2 className="mt-4 text-base font-semibold text-stone-900">Đang quét {files.length} bài nộp</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Đã xử lý {processed}/{files.length} file
                  {eta !== null && eta > 0 ? ` · còn khoảng ${eta}s` : " · đang hoàn tất"}
                </p>
                <div className="mx-auto mt-6 h-1.5 w-full max-w-sm overflow-hidden bg-stone-100" style={{ borderRadius: 999 }}>
                  <div className="h-full bg-stone-900 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-sm font-medium text-stone-700">{progress}%</p>
                <button
                  type="button"
                  onClick={() => void cancelScan()}
                  data-guide="upload-cancel"
                  className="mt-5 inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <FaStop className="text-xs" /> Huỷ quét
                </button>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <FaCheck className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-stone-900">Đã quét xong</h2>
                <p className="mt-1 text-sm text-stone-600">Đang mở trang kết quả…</p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
