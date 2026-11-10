import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCircleUser,
  FaClockRotateLeft,
  FaKey,
  FaMagnifyingGlass,
  FaFloppyDisk,
  FaTrashCan,
} from "react-icons/fa6";
import { useBackendData } from "../modules/lib/hook/backend-data-context";
import { EmptyState } from "../modules/lib/Components/UI/feedback/StatePanel";
import { useToast } from "../modules/lib/Components/UI/feedback/Toast";
import { useConfirm } from "../modules/lib/Components/UI/feedback/ConfirmDialog";
import { Button, Card, CardTitle, Badge } from "../modules/lib/Components/UI/Button/Button";

interface ProfileData {
  displayName: string;
  email: string;
  department: string;
  role: string;
  bio: string;
}

const STORAGE_KEY = "codex.profile.v1";

const readProfile = (): ProfileData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileData>;
      return {
        displayName: parsed.displayName ?? "Giảng viên",
        email: parsed.email ?? "gv@university.edu.vn",
        department: parsed.department ?? "Khoa Công nghệ thông tin",
        role: parsed.role ?? "Giảng viên",
        bio: parsed.bio ?? "",
      };
    }
  } catch {
    // Bỏ qua nếu dữ liệu hỏng.
  }
  return {
    displayName: "Giảng viên",
    email: "gv@university.edu.vn",
    department: "Khoa Công nghệ thông tin",
    role: "Giảng viên",
    bio: "",
  };
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "GV";

export default function ProfilePage() {
  const toast = useToast();
  // Nguồn dữ liệu THẬT từ backend (UI giữ nguyên 100%).
  const { submissions: mockSubmissions, activity: recentActivity } = useBackendData();
  const confirm = useConfirm();
  const [form, setForm] = useState<ProfileData>(readProfile);
  const [historyQuery, setHistoryQuery] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  const history = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return mockSubmissions.filter(
      (s) =>
        !q ||
        s.fileName.toLowerCase().includes(q) ||
        s.studentName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q),
    );
  }, [historyQuery, mockSubmissions]);

  const saveProfile = () => {
    if (!form.displayName.trim()) {
      toast.error("Tên hiển thị chưa có", "Hãy nhập tên hiển thị để tiếp tục.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email không hợp lệ", "Hãy kiểm tra lại định dạng email.");
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Bỏ qua nếu trình duyệt chặn lưu trữ.
    }
    toast.success("Đã lưu hồ sơ", "Thông tin giảng viên đã được cập nhật.");
  };

  const changePassword = () => {
    setPwError("");
    if (currentPw.length < 1) {
      setPwError("Hãy nhập mật khẩu hiện tại.");
      return;
    }
    if (nextPw.length < 8) {
      setPwError("Mật khẩu mới cần ít nhất 8 ký tự.");
      return;
    }
    if (nextPw !== confirmPw) {
      setPwError("Xác nhận mật khẩu chưa khớp.");
      return;
    }
    setCurrentPw("");
    setNextPw("");
    setConfirmPw("");
    toast.success("Đã đổi mật khẩu", "Mật khẩu mới đã có hiệu lực. Hãy đăng nhập lại nếu cần.");
  };

  const clearHistory = async () => {
    const ok = await confirm({
      title: "Xoá lịch sử quét hiển thị?",
      description:
        "Danh sách lịch sử hiện tại sẽ được xoá khỏi hồ sơ. Dữ liệu quét thật trên máy chủ không bị ảnh hưởng.",
      confirmLabel: "Xoá lịch sử",
      tone: "danger",
    });
    if (!ok) return;
    setHistoryQuery("");
    toast.info("Đã xoá bộ lọc lịch sử", "Nhấn tìm để xem lại toàn bộ danh sách.");
  };

  const field =
    "w-full border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600 dark:text-stone-400">
          CODEX / Hồ sơ
        </p>
        <h1 className="mt-2 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          <FaCircleUser className="text-stone-500" /> Hồ sơ giảng viên
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Quản lý thông tin giảng viên, đổi mật khẩu và rà soát lịch sử các đợt quét gần nhất.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Thông tin chung */}
        <Card className="xl:col-span-2">
          <CardTitle>Thông tin chung</CardTitle>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-900 text-xl font-bold text-white dark:bg-amber-400 dark:text-stone-900">
              {initials(form.displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-stone-900 dark:text-stone-100">{form.displayName}</p>
              <p className="truncate text-sm text-stone-600 dark:text-stone-400">{form.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="default">{form.role}</Badge>
                <Badge tone="info">{form.department}</Badge>
              </div>
            </div>
            <Button onClick={saveProfile}>
              <FaFloppyDisk /> Lưu hồ sơ
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">Tên hiển thị</span>
              <input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className={field}
                style={{ borderRadius: 7 }}
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">Email</span>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={field}
                style={{ borderRadius: 7 }}
                type="email"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">Đơn vị</span>
              <input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className={field}
                style={{ borderRadius: 7 }}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">Vai trò</span>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className={field}
                style={{ borderRadius: 7 }}
              >
                <option>Giảng viên</option>
                <option>Trợ giảng</option>
                <option>Quản trị viên</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">
                Ghi chú (không bắt buộc)
              </span>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                className={field}
                style={{ borderRadius: 7 }}
                rows={3}
                placeholder="Ví dụ: phụ trách lớp CTK46, môn Lập trình nâng cao…"
              />
            </label>
          </div>

          {/* Đổi mật khẩu */}
          <div className="mt-6 border-t border-stone-100 pt-5 dark:border-stone-700">
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <FaKey className="text-stone-500" size={13} /> Đổi mật khẩu
              </span>
            </CardTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">Mật khẩu hiện tại</span>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={field}
                  style={{ borderRadius: 7 }}
                  autoComplete="current-password"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">Mật khẩu mới (≥ 8 ký tự)</span>
                <input
                  type="password"
                  value={nextPw}
                  onChange={(e) => setNextPw(e.target.value)}
                  className={field}
                  style={{ borderRadius: 7 }}
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">Nhập lại mật khẩu mới</span>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={field}
                  style={{ borderRadius: 7 }}
                  autoComplete="new-password"
                />
              </label>
            </div>
            {pwError && (
              <p role="alert" className="mt-3 text-xs font-medium text-red-700 dark:text-red-400">
                {pwError}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={changePassword}>
                <FaKey /> Đổi mật khẩu
              </Button>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Thao tác này không đăng xuất khỏi các phiên khác trong bản demo lưu local.
              </span>
            </div>
          </div>
        </Card>

        {/* Lịch sử quét */}
        <Card>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <FaClockRotateLeft className="text-stone-500" size={13} /> Lịch sử quét
              </span>
            </CardTitle>
            <Badge tone="ok">{mockSubmissions.length} bài</Badge>
          </div>

          <div className="relative mt-4">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-500" />
            <input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Tìm file / sinh viên…"
              className={`${field} pl-9 py-2`}
              style={{ borderRadius: 7 }}
              aria-label="Tìm trong lịch sử quét"
            />
          </div>

          {history.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {history.slice(0, 8).map((s) => (
                <li key={s.id} className="flex items-center gap-3 border-b border-stone-100 pb-3 last:border-0 last:pb-0 dark:border-stone-700">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      s.label === "plagiarism"
                        ? "bg-red-600"
                        : s.label === "suspicious"
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-800 dark:text-stone-200">{s.fileName}</span>
                    <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                      {s.studentName} · {s.uploadedAt} · {s.similarity}%
                    </span>
                  </span>
                  <Link
                    to={`/compare?file=${encodeURIComponent(s.fileName)}`}
                    className="shrink-0 text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
                  >
                    Xem <FaArrowRight className="inline text-[10px]" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Không tìm thấy bài trong lịch sử"
              description="Thử từ khoá khác, hoặc quay lại Tổng quan để nạp bài mới."
              action={
                <Link to="/results">
                  <Button variant="secondary" size="sm">Mở kết quả quét</Button>
                </Link>
              }
            />
          )}

          <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Hoạt động gần đây</p>
            <ul className="mt-3 space-y-2">
              {recentActivity.slice(0, 3).map((a) => (
                <li key={a.id} className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  {a.text} <span className="text-stone-400">· {a.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => void clearHistory()}>
              <FaTrashCan /> Xoá bộ lọc
            </Button>
            <Link to="/results" className="ml-auto">
              <Button variant="secondary" size="sm">Mở Results <FaArrowRight /></Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
