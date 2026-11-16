import { FaArrowRight } from "react-icons/fa6";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-serif text-5xl font-semibold tracking-tight text-stone-900 md:text-6xl">
          404
        </h1>
        <div className="mx-auto mt-5 h-px w-64 rounded-full bg-gradient-to-r from-stone-300 via-amber-400 to-stone-300" />
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-stone-600 md:text-base">
          Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
        </p>
        <a
          href="/dashboard"
          className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md active:scale-[0.98]"
        >
          Về trang tổng quan
          <FaArrowRight className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}