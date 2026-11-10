import type { ReactNode } from "react";
import { FaCircleExclamation, FaInbox, FaRotateRight } from "react-icons/fa6";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 border border-dashed border-stone-300 bg-white px-6 py-10 text-center ${className}`}
      style={{ borderRadius: 10 }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        {icon ?? <FaInbox size={17} />}
      </span>
      <p className="mt-1 text-sm font-semibold text-stone-800">{title}</p>
      {description && (
        <p className="max-w-md text-xs leading-relaxed text-stone-600">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Đã có lỗi xảy ra",
  description = "Không tải được dữ liệu. Vui lòng thử lại.",
  onRetry,
  retryLabel = "Thử lại",
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-1.5 border border-red-200 bg-red-50/60 px-6 py-10 text-center ${className}`}
      style={{ borderRadius: 10 }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
        <FaCircleExclamation size={17} />
      </span>
      <p className="mt-1 text-sm font-semibold text-stone-900">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-stone-600">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          <FaRotateRight /> {retryLabel}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton block rounded bg-stone-200/80 ${className}`}
    />
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border border-stone-200 bg-white p-4"
          style={{ borderRadius: 10 }}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Đang tải dữ liệu">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="space-y-3 border border-stone-200 bg-white p-4"
          style={{ borderRadius: 10 }}
        >
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
