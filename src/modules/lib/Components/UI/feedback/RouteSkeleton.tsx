import { Skeleton } from "./StatePanel";

export function RouteSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Đang tải trang">
      <div className="space-y-3 border-b border-stone-200 pb-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-3 h-7 w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
              <Skeleton className="h-10 w-64 max-w-[60%]" />
              <Skeleton className="ml-auto h-7 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
          <div className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-3 h-3 w-full" />
          </div>
        </div>
      </div>
      <span className="sr-only">Đang tải nội dung…</span>
    </div>
  );
}

export default RouteSkeleton;
