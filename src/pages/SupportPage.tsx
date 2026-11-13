import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCheck,
  FaCopy,
  FaHeart,
  FaQrcode,
  FaUniversity,
  FaExternalLinkAlt,
} from "react-icons/fa";

import {
  Button,
  Card,
  CardTitle,
  CardDescription,
} from "../modules/lib/Components/UI/Button/Button";

// ============================================
// CẤU HÌNH
// ============================================

// Thông tin tài khoản ngân hàng nhận ủng hộ thủ công.
// Thay bằng thông tin thật trước khi triển khai.
const BANK_INFO = {
  bankName: "Tên ngân hàng",
  accountNumber: "Số tài khoản",
  accountHolder: "CHỦ TÀI KHOẢN",
};

// Link trang GitHub Sponsors
const SUPPORT_SPONSOR_URL =
  "https://tree.icqr.com/s/MDBodHRwczovL2dpdGh1Yi5jb20vbmd1eWVubmd1eWVuMjE";

// Địa chỉ Node.js Backend
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

const formatVnd = (value: number) =>
  `${value.toLocaleString("vi-VN")}đ`;

// Các mức số tiền ủng hộ nhanh
const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

// ============================================
// COMPONENT
// ============================================

export default function SupportPage() {
  const [amount, setAmount] = useState("100000");

  // Phương thức thanh toán đang chọn
  const [paymentMethod, setPaymentMethod] = useState<
    "sepay" | "bank"
  >("sepay");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("");

  // Lưu tạm thông tin người chuyển và số tiền ủng hộ để tái sử dụng trên trang.
  useEffect(() => {
    try {
      localStorage.setItem(
        "codex.support.donation",
        JSON.stringify({ senderName, amount }),
      );
    } catch {
      // Bỏ qua nếu trình duyệt chặn lưu trữ.
    }
  }, [senderName, amount]);

  // Nạp lại thông tin vừa lưu khi người dùng vào lại trang ủng hộ.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("codex.support.donation");
      if (!raw) return;
      const parsed = JSON.parse(
        raw,
      ) as { senderName?: string; amount?: string };
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.senderName === "string") {
          setSenderName(parsed.senderName);
        }
        if (typeof parsed.amount === "string") {
          setAmount(parsed.amount);
        }
      }
    } catch {
      // Bỏ qua nếu dữ liệu lưu trữ bị hỏng.
    }
  }, []);

  // Tính số tiền hợp lệ
  const parsedAmount = useMemo(() => {
    const value = Number(amount);

    return Number.isSafeInteger(value) && value > 0
      ? value
      : 0;
  }, [amount]);

  // Nội dung chuyển khoản
  const transferContent = "UNG HO CODEX";

  // ============================================
  // SAO CHÉP THÔNG TIN
  // ============================================

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

    window.setTimeout(() => {
      setCopiedKey((current) =>
        current === key ? null : current
      );
    }, 2000);
  };

  // ============================================
  // THANH TOÁN SEPAY
  // ============================================

  const handleSepayPayment = async () => {
    if (parsedAmount < 1000) {
      setError("Số tiền ủng hộ tối thiểu là 1.000đ.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 1. Gửi yêu cầu tạo giao dịch đến Node.js
      const response = await fetch(
        `${API_URL}/api/payments/sepay/create-donation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parsedAmount,
            senderName: senderName.trim(),
          }),
        }
      );

      const responseText = await response.text();

      let result: any;

      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("API trả về HTML hoặc dữ liệu không phải JSON:", {
          status: response.status,
          url: response.url,
          response: responseText,
        });

        throw new Error(
          `API không trả về JSON (HTTP ${response.status}). Kiểm tra Backend và đường dẫn API.`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tạo giao dịch thanh toán."
        );
      }

      const payment = result.data;

      // 2. Kiểm tra dữ liệu trả về
      if (!payment.checkoutUrl || !payment.fields) {
        throw new Error(
          "Thông tin thanh toán từ máy chủ không hợp lệ."
        );
      }

      // 3. Tạo form gửi thông tin đã ký đến SePay
      const form = document.createElement("form");

      form.method = "POST";
      form.action = payment.checkoutUrl;

      Object.entries(payment.fields).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        const input = document.createElement("input");

        input.type = "hidden";
        input.name = key;
        input.value = String(value);

        form.appendChild(input);
      });

      // 4. Chuyển người dùng đến trang checkout SePay
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi thanh toán.";

      setError(message);
      setLoading(false);
    }
  };

  // ============================================
  // DANH SÁCH TÀI KHOẢN
  // ============================================

  const accountRows = [
    {
      key: "bankName",
      label: "Ngân hàng",
      value: BANK_INFO.bankName,
    },
    {
      key: "accountNumber",
      label: "Số tài khoản",
      value: BANK_INFO.accountNumber,
    },
    {
      key: "accountHolder",
      label: "Chủ tài khoản",
      value: BANK_INFO.accountHolder,
    },
    {
      key: "transferContent",
      label: "Nội dung chuyển khoản",
      value: transferContent,
    },
  ];

  // ============================================
  // GIAO DIỆN
  // ============================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
            CODEX / Hỗ trợ
          </p>

          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200">
              <FaHeart size={18} aria-hidden="true" />
            </span>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
              Ủng hộ CODEX
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Sự ủng hộ của bạn giúp CODEX duy trì hoạt động,
            cải tiến thuật toán và phát triển thêm nhiều tính năng
            hữu ích cho cộng đồng lập trình.
          </p>
        </div>

        <a
          href={SUPPORT_SPONSOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          GitHub Sponsors
          <FaExternalLinkAlt size={10} />
        </a>
      </div>

      {/* PAYMENT CARD */}
      <Card>
        <CardTitle>Chọn phương thức ủng hộ</CardTitle>

        <CardDescription>
          Bạn có thể thanh toán trực tuyến qua SePay hoặc
          chuyển khoản trực tiếp bằng ứng dụng ngân hàng.
        </CardDescription>

        {/* CHỌN PHƯƠNG THỨC */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* SEPAY */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod("sepay");
              setError("");
            }}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
              paymentMethod === "sepay"
                ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                : "border-stone-200 bg-white hover:border-stone-400"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <FaQrcode size={18} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-stone-900">
                Thanh toán online
              </span>

              <span className="mt-1 block text-xs text-stone-500">
                VietQR qua SePay
              </span>
            </span>
          </button>

          {/* BANK TRANSFER */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod("bank");
              setError("");
            }}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
              paymentMethod === "bank"
                ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                : "border-stone-200 bg-white hover:border-stone-400"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <FaUniversity size={18} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-stone-900">
                Chuyển khoản thủ công
              </span>

              <span className="mt-1 block text-xs text-stone-500">
                Qua ứng dụng ngân hàng
              </span>
            </span>
          </button>
        </div>

        {/* ================================== */}
        {/* PHƯƠNG THỨC SEPAY */}
        {/* ================================== */}

        {paymentMethod === "sepay" && (
          <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-rose-600">
                <FaQrcode size={17} />
              </span>

              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Thanh toán qua VietQR
                </p>

                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  Nhấn nút bên dưới để tạo giao dịch. Hệ thống
                  sẽ chuyển bạn đến trang thanh toán SePay để
                  quét mã QR bằng ứng dụng ngân hàng.
                </p>
              </div>
            </div>

            {/* NHẬP SỐ TIỀN */}
            <div className="mt-6">
              <label
                htmlFor="support-amount"
                className="text-xs font-semibold uppercase tracking-wide text-stone-600"
              >
                Số tiền muốn ủng hộ (VNĐ)
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(String(preset));
                      setError("");
                    }}
                    className={`rounded-md border px-3 py-2.5 text-xs font-semibold transition-colors ${
                      String(preset) === amount
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
                    }`}
                  >
                    {formatVnd(preset)}
                  </button>
                ))}
              </div>

              <input
                id="support-amount"
                type="number"
                min={1000}
                max={50000000}
                step={1000}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                placeholder="Nhập số tiền tùy chỉnh"
                className="mt-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 font-mono text-sm text-stone-900 focus:outline-2 focus:outline-stone-900"
              />

              <p className="mt-2 text-xs text-stone-500">
                Số tiền tối thiểu 1.000đ.
              </p>
            </div>

            {/* SỐ TIỀN ỦNG HỘ */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-rose-100 bg-white p-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Số tiền ủng hộ
                </p>

                <p className="mt-1 text-xl font-bold text-stone-900">
                  {formatVnd(parsedAmount)}
                </p>
              </div>

              <FaHeart className="text-rose-500" size={22} />
            </div>

            {/* TÊN NGƯỜI CHUYỂN */}
            <div className="mt-4">
              <label
                htmlFor="support-sender"
                className="text-xs font-semibold uppercase tracking-wide text-stone-600"
              >
                Tên người chuyển tiền
              </label>

              <input
                id="support-sender"
                type="text"
                value={senderName}
                onChange={(event) => {
                  setSenderName(event.target.value);
                  setError("");
                }}
                placeholder="Nhập tên người chuyển tiền"
                className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-2 focus:outline-stone-900"
              />

              <p className="mt-2 text-xs text-stone-500">
                Họ tên người chuyển khoán để quản trị viên dễ dàng
                đối soát được thông tin người ủng hộ.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <Button
              type="button"
              className="mt-5 w-full"
              onClick={handleSepayPayment}
              disabled={loading || parsedAmount < 1000}
            >
              {loading
                ? "Đang tạo giao dịch..."
                : "Thanh toán bằng VietQR"}

              {!loading && (
                <FaArrowRight className="ml-2 inline-block" size={12} />
              )}
            </Button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-stone-500">
              Giao dịch được xử lý qua SePay. Trạng thái thanh toán
              sẽ được xác nhận từ hệ thống máy chủ.
            </p>
          </div>
        )}

        {/* ================================== */}
        {/* CHUYỂN KHOẢN THỦ CÔNG */}
        {/* ================================== */}

        {paymentMethod === "bank" && (
          <div className="mt-5">
            <div className="rounded-lg border border-stone-200 bg-[#fbfbfa] p-4">
              <div className="mb-4 flex items-center gap-2">
                <FaUniversity className="text-stone-600" />

                <p className="text-sm font-semibold text-stone-900">
                  Thông tin tài khoản nhận ủng hộ
                </p>
              </div>

              {accountRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 border-b border-stone-100 py-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      {row.label}
                    </p>

                    <p className="mt-1 break-all font-mono text-sm font-semibold text-stone-900">
                      {row.value}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyValue(row.key, row.value)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    {copiedKey === row.key ? (
                      <FaCheck size={11} />
                    ) : (
                      <FaCopy size={11} />
                    )}

                    {copiedKey === row.key
                      ? "Đã sao chép"
                      : "Sao chép"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs leading-relaxed text-amber-800">
                Khi chuyển khoản thủ công, vui lòng nhập đúng
                nội dung chuyển khoản để quản trị viên dễ dàng
                đối soát giao dịch.
              </p>
            </div>

            <Button
              type="button"
              className="mt-5 w-full"
              onClick={() =>
                copyValue(
                  "manual-transfer",
                  `${transferContent} - ${senderName} - ${formatVnd(parsedAmount)}`
                )
              }
              disabled={parsedAmount < 1000}
            >
              {copiedKey === "manual-transfer"
                ? "Đã sao chép nội dung"
                : "Sao chép nội dung chuyển khoản"}

              {copiedKey === "manual-transfer" ? (
                <FaCheck className="ml-2 inline-block" size={12} />
              ) : (
                <FaCopy className="ml-2 inline-block" size={12} />
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* FOOTER */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <FaHeart className="mt-0.5 shrink-0 text-rose-500" />

          <p className="text-xs leading-relaxed text-stone-500">
            Mọi khoản ủng hộ đều được sử dụng để duy trì hạ tầng,
            cải tiến thuật toán và phát triển CODEX. Cảm ơn bạn
            đã đồng hành cùng dự án!
          </p>
        </div>

        <Link
          to={`/support/receipt?sender=${encodeURIComponent(senderName)}&amount=${parsedAmount}`}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 underline-offset-2 hover:underline"
        >
          In biên lai ủng hộ
          <FaArrowRight className="text-xs" />
        </Link>
      </div>
    </div>
  );
}
