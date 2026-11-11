import { useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCheck,
  FaCircleCheck,
  FaCopy,
  FaHeart,
} from "react-icons/fa6";
import { Button, Card, CardTitle, CardDescription } from "../modules/lib/Components/UI/Button/Button";

// Thông tin tài khoản ngân hàng nhận ủng hộ — VUI LÒNG CẬP NHẬT SỐ LIỆU THỰC TẾ.
const BANK_INFO = {
  bankName: "Tên ngân hàng",
  accountNumber: "Số tài khoản",
  accountHolder: "Chủ tài khoản",
};

const SUPPORT_SPONSOR_URL = "https://github.com/nguyennguyen21";

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

const formatVnd = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export default function SupportPage() {
  const [amount, setAmount] = useState<string>(String(PRESET_AMOUNTS[1]));
  const [confirmed, setConfirmed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }, [amount]);

  const transferContent = `Ủng hộ CODEX${parsedAmount > 0 ? ` · ${formatVnd(parsedAmount)}` : ""}`;

  const copyValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = value;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      document.body.removeChild(helper);
    }
    setCopiedKey(key);
  };

  const confirmTransfer = () => {
    if (parsedAmount <= 0) return;
    setConfirmed(true);
  };

  const resetTransfer = () => setConfirmed(false);

  const accountRows = [
    { key: "bankName", label: "Ngân hàng", value: BANK_INFO.bankName },
    { key: "accountNumber", label: "Số tài khoản", value: BANK_INFO.accountNumber },
    { key: "accountHolder", label: "Chủ tài khoản", value: BANK_INFO.accountHolder },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">CODEX / Hỗ trợ</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200">
              <FaHeart size={18} aria-hidden="true" />
            </span>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">Ủng hộ CODEX</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            CODEX là công cụ chống đạo văn miễn phí cho cộng đồng. Nếu bạn muốn ủng hộ quá trình phát
            triển mã nguồn, bạn có thể chuyển khoản qua ngân hàng bên dưới hoặc ủng hộ qua GitHub
            Sponsors.
          </p>
        </div>
        <a
          href={SUPPORT_SPONSOR_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          Hủy tặng qua GitHub Sponsors
          <FaArrowRight className="text-xs" />
        </a>
      </div>

      {/* Bank transfer */}
      <Card>
        <CardTitle>Ủng hộ qua chuyển khoản ngân hàng</CardTitle>
        <CardDescription>
          Mở ứng dụng ngân hàng, chọn chức năng chuyển khoản và nhập thông tin tài khoản bên dưới.
          Sau khi chuyển xong, bấm nút xác nhận để hoàn tất ủng hộ.
        </CardDescription>

        {confirmed ? (
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <FaCircleCheck className="mt-0.5 shrink-0 text-emerald-600" size={20} />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Đã ghi nhận yêu cầu chuyển khoản</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                  Cảm ơn bạn đã ủng hộ CODEX!
                  {parsedAmount > 0 ? ` Hãy chuyển đúng số tiền ${formatVnd(parsedAmount)} vào tài khoản bên dưới.` : ""}{" "}
                  Nội dung chuyển khoản:{" "}
                  <span className="font-mono">{transferContent}</span>
                </p>
                <button
                  type="button"
                  onClick={resetTransfer}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
                >
                  Quay lại thông tin chuyển khoản
                  <FaArrowRight className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-md border border-stone-200 bg-[#fbfbfa] p-4">
              {accountRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{row.label}</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold break-all text-stone-900">{row.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue(row.key, row.value)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    {copiedKey === row.key ? <FaCheck size={11} /> : <FaCopy size={11} />}
                    {copiedKey === row.key ? "Đã sao chép" : "Sao chép"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <label
                htmlFor="support-amount"
                className="text-xs font-semibold uppercase tracking-wide text-stone-600"
              >
                Số tiền ủng hộ (VNĐ)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      String(preset) === amount
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-900"
                    }`}
                  >
                    {formatVnd(preset)}
                  </button>
                ))}
              </div>
              <input
                id="support-amount"
                type="number"
                min={1}
                step={1000}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Nhập số tiền tùy chỉnh"
                className="mt-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 font-mono text-sm text-stone-900 focus:outline-2 focus:outline-stone-900"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 p-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Nội dung chuyển khoản
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold break-all text-stone-900">{transferContent}</p>
              </div>
              <button
                type="button"
                onClick={() => copyValue("transferContent", transferContent)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              >
                {copiedKey === "transferContent" ? <FaCheck size={11} /> : <FaCopy size={11} />}
                {copiedKey === "transferContent" ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>

            <div className="mt-5">
              <Button type="button" className="w-full" onClick={confirmTransfer} disabled={parsedAmount <= 0}>
                Tôi đã chuyển khoản
              </Button>
            </div>
          </>
        )}
      </Card>

      <p className="text-xs leading-relaxed text-stone-500">
        Các khoản ủng hộ giúp duy trì hạ tầng, cải tiến thuật toán và bổ sung mẫu mã nguồn cho CODEX.
        Mọi thông tin chuyển khoản sẽ được đối soát sau khi nhận được từ phía quản trị hệ thống.
      </p>
    </div>
  );
}
