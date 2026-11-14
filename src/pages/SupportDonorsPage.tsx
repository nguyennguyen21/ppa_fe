import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaHeart, FaPrint } from "react-icons/fa6";
import { Card, CardTitle, CardDescription } from "../shared/Components/UI/Button/Button";

interface DonationRecord {
  id?: string;
  senderName: string;
  transferContent: string;
  amount: number;
  status?: string;
  createdAt?: string;
}

// Địa chỉ Node.js Backend
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function SupportDonorsPage() {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tải danh sách người ủng hộ từ Backend (dữ liệu luôn mới nhất).
  useEffect(() => {
    let cancelled = false;

    const loadDonations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/payments/donations`);

        const responseText = await response.text();

        let result: any;

        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error(
            `API không trả về JSON (HTTP ${response.status}). Kiểm tra Backend và đường dẫn API.`
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Không thể lấy danh sách người ủng hộ."
          );
        }

        if (!cancelled) {
          setDonations(
            Array.isArray(result.data) ? (result.data as DonationRecord[]) : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi khi tải danh sách người ủng hộ.";

          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDonations();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
            CODEX / Hỗ trợ
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Danh sách người ủng hộ
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Danh sách các người đã ủng hộ CODEX cùng số tiền họ
            đã chuyển qua các kênh thanh toán.
          </p>
        </div>

        <Link
          to="/support"
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          Trang ủng hộ
          <FaArrowRight className="text-xs" />
        </Link>
      </div>

      {/* DONATION LIST */}
      <Card>
        <CardTitle>Các khoản ủng hộ</CardTitle>

        <CardDescription>
          Thông tin các khoản tiền ủng hộ được lưu trong file dữ
          liệu.
        </CardDescription>

        {loading ? (
          <div className="mt-5 rounded-lg border border-stone-200 bg-[#fbfbfa] p-6 text-center">
            <p className="text-sm font-semibold text-stone-900">
              Đang tải danh sách...
            </p>
          </div>
        ) : error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        ) : donations.length === 0 ? (
          <div className="mt-5 rounded-lg border border-stone-200 bg-[#fbfbfa] p-6 text-center">
            <FaHeart className="mx-auto text-rose-400" size={22} />

            <p className="mt-2 text-sm font-semibold text-stone-900">
              Chưa có dữ liệu ủng hộ
            </p>

            <p className="mt-1 text-xs leading-relaxed text-stone-600">
              Các khoản ủng hộ sau khi được tạo sẽ hiển thị tại
              trang này.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {donations.map((donation, index) => (
              <div
                key={donation.id ?? `donation-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-[#fbfbfa] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-bold text-rose-600">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900">
                      {donation.senderName}
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-stone-600">
                      {donation.transferContent}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-stone-900">
                    {donation.amount.toLocaleString("vi-VN")}đ
                  </span>

                  <Link
                    to={`/support/receipt?sender=${encodeURIComponent(
                      donation.senderName
                    )}&amount=${donation.amount}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900"
                  >
                    <FaPrint /> In biên lai
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* FOOTER */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <FaHeart className="mt-0.5 shrink-0 text-rose-500" />

          <p className="text-xs leading-relaxed text-stone-500">
            Cảm ơn các bạn đã ủng hộ CODEX. Danh sách này được lưu
            trong file dữ liệu và được cập nhật khi có khoản
            chuyển mới.
          </p>
        </div>
      </div>
    </div>
  );
}
