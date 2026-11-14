// PaginationControl.tsx
import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export interface PaginationControlProps {
  // Dữ liệu
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  // Văn bản
  prevLabel?: string;
  nextLabel?: string;
  ofPagesLabel?: string; // Ví dụ: "of 99 pages"

  // Kích thước
  size?: "sm" | "md" | "lg";

  // Màu sắc tùy chỉnh (Tailwind classes)
  containerSpacing?: string;
  selectBgColor?: string;
  selectBorderColor?: string;
  selectFocusRing?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  buttonBgColor?: string;
  buttonHoverBgColor?: string;
  buttonBorderColor?: string;
  buttonFocusRing?: string;
  iconColor?: string;
  iconHoverColor?: string;
  textColor?: string;

  // Giới hạn số lượng option trong dropdown (tránh render quá nhiều nếu totalPages lớn)
  maxSelectOptions?: number;
  
  className?: string;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  prevLabel = "Previous",
  nextLabel = "Next",
  ofPagesLabel = "of {total} pages",
  size = "md",
  containerSpacing = "space-x-3",
  selectBgColor = "bg-white",
  selectBorderColor = "border-stone-300",
  selectFocusRing = "focus:border-stone-900",
  inputBgColor = "bg-stone-50",
  inputBorderColor = "border-stone-200",
  buttonBgColor = "bg-white",
  buttonHoverBgColor = "hover:bg-stone-50",
  buttonBorderColor = "border-stone-300",
  buttonFocusRing = "focus-visible:ring-stone-300",
  iconColor = "text-stone-600",
  iconHoverColor = "group-hover:text-stone-900",
  textColor = "text-stone-700",
  maxSelectOptions = 100,
  className,
}) => {
  // Đảm bảo currentPage nằm trong khoảng hợp lệ
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const displayTotal = Math.min(totalPages, maxSelectOptions);

  const handlePrev = () => {
    if (safeCurrentPage > 1) onPageChange(safeCurrentPage - 1);
  };

  const handleNext = () => {
    if (safeCurrentPage < totalPages) onPageChange(safeCurrentPage + 1);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageChange(Number(e.target.value));
  };

  // Mapping kích thước
  const sizeClasses = {
    sm: {
      select: "w-14 px-2 py-1.5 text-xs",
      input: "w-24 px-2 py-1.5 text-xs",
      button: "w-8 h-8",
      icon: "w-3 h-3",
      tooltip: "text-xs px-2 py-1",
    },
    md: {
      select: "w-16 px-3 py-2 text-sm",
      input: "w-28 px-2.5 py-2 text-sm",
      button: "w-9 h-9",
      icon: "w-4 h-4",
      tooltip: "text-sm px-3 py-2",
    },
    lg: {
      select: "w-20 px-4 py-2.5 text-base",
      input: "w-36 px-3 py-2.5 text-base",
      button: "w-10 h-10",
      icon: "w-5 h-5",
      tooltip: "text-base px-4 py-2.5",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <nav aria-label="Page navigation" className={className}>
      <form 
        className={`mx-auto flex items-center ${containerSpacing}`}
        onSubmit={(e) => e.preventDefault()} // Ngăn reload form
      >
        {/* 1. Page Selector Dropdown */}
        <label htmlFor="page-select" className="sr-only">
          Select page
        </label>
        <select
          id="page-select"
          value={safeCurrentPage}
          onChange={handleSelectChange}
          className={`block rounded-md border shadow-sm transition-colors focus:outline-none focus:ring-2 ${selectBgColor} ${selectBorderColor} ${textColor} ${currentSize.select} ${selectFocusRing}`}
        >
          {Array.from({ length: displayTotal }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              {page.toString().padStart(2, "0")}
            </option>
          ))}
          {totalPages > maxSelectOptions && (
            <option disabled>... (Max {maxSelectOptions})</option>
          )}
        </select>

        {/* 2. Total Pages Display (Disabled Input) */}
        <input
          type="text"
          readOnly
          value={ofPagesLabel.replace("{total}", totalPages.toString())}
          className={`block rounded-md border shadow-sm cursor-not-allowed ${inputBgColor} ${inputBorderColor} ${textColor} opacity-70 ${currentSize.input}`}
        />

        {/* 3. Navigation Buttons Group */}
        <div className="inline-flex rounded-md shadow-sm -space-x-px" role="group">
          
          {/* Previous Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeCurrentPage === 1}
              className={`inline-flex items-center justify-center rounded-l-md border transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonBgColor} ${buttonBorderColor} ${buttonHoverBgColor} ${buttonFocusRing} ${currentSize.button}`}
              aria-label={prevLabel}
            >
              <FaChevronLeft className={`${currentSize.icon} ${iconColor} ${iconHoverColor} transition-colors`} />
            </button>
            {/* Pure CSS Tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10 bg-stone-900 text-white rounded-md shadow-lg whitespace-nowrap ${currentSize.tooltip}`}>
              {prevLabel}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></div>
            </div>
          </div>

          {/* Next Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleNext}
              disabled={safeCurrentPage === totalPages}
              className={`inline-flex items-center justify-center rounded-r-md border transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonBgColor} ${buttonBorderColor} ${buttonHoverBgColor} ${buttonFocusRing} ${currentSize.button}`}
              aria-label={nextLabel}
            >
              <FaChevronRight className={`${currentSize.icon} ${iconColor} ${iconHoverColor} transition-colors`} />
            </button>
            {/* Pure CSS Tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10 bg-stone-900 text-white rounded-md shadow-lg whitespace-nowrap ${currentSize.tooltip}`}>
              {nextLabel}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></div>
            </div>
          </div>

        </div>
      </form>
    </nav>
  );
};

export default PaginationControl;