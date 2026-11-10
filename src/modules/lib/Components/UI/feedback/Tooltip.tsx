import { useState } from "react";
import type { ReactNode } from "react";
import { FaCircleInfo } from "react-icons/fa6";

interface InfoTipProps {
  label: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
}

/** Biểu tượng thông tin nhỏ, hiện giải thích khi hover hoặc focus bàn phím. */
export function InfoTip({ label, children, className = "", side = "top" }: InfoTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-stone-600 transition-colors hover:text-stone-900"
      >
        <FaCircleInfo size={11} />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute left-1/2 z-50 w-60 -translate-x-1/2 border border-stone-200 bg-white px-2.5 py-2 text-left text-xs font-normal leading-relaxed text-stone-700 shadow-lg ${
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{ borderRadius: 8 }}
        >
          {children}
        </span>
      )}
    </span>
  );
}
