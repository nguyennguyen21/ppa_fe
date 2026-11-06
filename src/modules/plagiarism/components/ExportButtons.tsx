import { FaFileExcel, FaFilePdf } from "react-icons/fa6";

interface Props {
  onExcel: () => void;
  onPdf: () => void;
  disabled?: boolean;
  /** Hiện thêm chữ "Xuất" phía trước cho dễ hiểu. */
  showLabel?: boolean;
}

export default function ExportButtons({ onExcel, onPdf, disabled, showLabel = true }: Props) {
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-stone-400 sm:inline">
          Xuất
        </span>
      )}
      <button
        type="button"
        onClick={onExcel}
        disabled={disabled}
        title="Xuất Excel (.xlsx)"
        className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaFileExcel className="text-emerald-700" /> Excel
      </button>
      <button
        type="button"
        onClick={onPdf}
        disabled={disabled}
        title="Xuất PDF (mở hộp thoại in, chọn Lưu thành PDF)"
        className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaFilePdf className="text-red-700" /> PDF
      </button>
    </div>
  );
}
