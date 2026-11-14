import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaHeart, FaPrint } from "react-icons/fa6";
import { Button, Card, CardTitle, CardDescription } from "../shared/Components/UI/Button/Button";

// ============================================
// BIÊN LAI ỦNG HỘ CODEX
// ============================================

export default function SupportReceiptPage() {
  const [searchParams] = useSearchParams();

  const senderName =
    searchParams.get("sender")?.trim() || "Bạn hâm mộ CODEX";

  const amountParam = Number(searchParams.get("amount") ?? 0);
  const amount =
    Number.isFinite(amountParam) && amountParam > 0 ? amountParam : 0;
  const formattedAmount = `${amount.toLocaleString("vi-VN")}đ`;

  const transferContent = useMemo(
    () =>
      `UNG HO CODEX - ${formattedAmount}${
        senderName ? ` - ${senderName}` : ""
      }`,
    [formattedAmount, senderName],
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
            CODEX / Hỗ trợ
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Biên lai ủng hộ
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Biên lai ghi nhận tên người ủng hộ và số tiền ủng hộ đã
            chuyển qua CODEX.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          <FaPrint /> In biên lai
        </button>
      </div>

      {/* RECEIPT INFO */}
      <Card>
        <CardTitle>Tên người ủng hộ</CardTitle>
        <CardDescription>
          Thông tin người đã gửi khoản ủng hộ cho CODEX.
        </CardDescription>

        <div className="mt-5 rounded-lg bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Người ủng hộ
          </p>

          <p className="mt-1 text-lg font-semibold text-stone-900">
            {senderName}
          </p>
        </div>

        <div className="mt-5 rounded-lg bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Số tiền ủng hộ
          </p>

          <p className="mt-1 text-lg font-semibold text-stone-900">
            {formattedAmount}
          </p>
        </div>

        <div className="mt-5 rounded-lg border border-stone-200 bg-[#fbfbfa] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Nội dung chuyển khoản
          </p>

          <p className="mt-1 break-all font-mono text-sm font-semibold text-stone-900">
            {transferContent}
          </p>
        </div>

        <div className="mt-5">
          <Button type="button" className="w-full" onClick={handlePrint}>
            <FaPrint /> In biên lai
          </Button>
        </div>
      </Card>

      {/* BACK LINK */}
      <div className="text-center">
        <Link
          to="/support"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 underline-offset-2 hover:underline"
        >
          Quay lại trang ủng hộ
          <FaArrowRight className="text-xs" />
        </Link>
      </div>

      {/* FOOTER */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <FaHeart className="mt-0.5 shrink-0 text-rose-500" />

          <p className="text-xs leading-relaxed text-stone-500">
            Cảm ơn bạn đã ủng hộ CODEX. Biên lai này được tạo tự động
            từ thông tin người chuyển tiền và số tiền ủng hộ.
          </p>
        </div>
      </div>
    </div>
  );
}
