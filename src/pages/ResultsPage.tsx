import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCodeCompare, FaMagnifyingGlass, FaSliders, FaXmark } from "react-icons/fa6";
import type { Submission } from "../data/types";
import { useBackendData } from "../shared/hook/backend-data-context";
import PaginationControl from "../shared/Components/UI/Pagination/PaginationControl";
import ItemsPerPageSelector from "../shared/Components/UI/Selector/ItemsPerPageSelector";
import { EmptyState } from "../shared/Components/UI/feedback/StatePanel";
import { useToast } from "../shared/Components/UI/feedback/Toast";
import { usePrefs } from "../shared/hook/prefs-context";

type SortKey = "similarity" | "fileName" | "uploadedAt";
type LabelFilter = "all" | Submission["label"];

const labelStyle: Record<Submission["label"], { text: string; bg: string; bar: string }> = {
  plagiarism: { text: "text-red-700", bg: "bg-red-50 ring-red-200", bar: "bg-red-600" },
  suspicious: { text: "text-amber-800", bg: "bg-amber-50 ring-amber-200", bar: "bg-amber-500" },
  innocent: { text: "text-stone-700", bg: "bg-stone-100 ring-stone-200", bar: "bg-stone-500" },
};

const labelName = (label: Submission["label"]) =>
  label === "plagiarism" ? "Cần xem lại" : label === "suspicious" ? "Nghi ngờ" : "Không có dấu hiệu";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(needle)})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle.toLowerCase() ? (
          <mark key={index} className="rounded-sm bg-amber-200 px-0.5 text-stone-900">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  // Nguồn dữ liệu THẬT từ backend (UI giữ nguyên 100%).
  const { submissions: mockSubmissions } = useBackendData();
  const { density } = usePrefs();
  const rowPad = density === "compact" ? "p-3" : "p-4";
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<LabelFilter>("all");
  const [sort, setSort] = useState<SortKey>("similarity");
  const [selected, setSelected] = useState<string[]>([]);

  const stats = useMemo(
    () => ({
      total: mockSubmissions.length,
      plag: mockSubmissions.filter((s) => s.label === "plagiarism").length,
      suspicious: mockSubmissions.filter((s) => s.label === "suspicious").length,
      innocent: mockSubmissions.filter((s) => s.label === "innocent").length,
      avg: mockSubmissions.length > 0
        ? Math.round(mockSubmissions.reduce((a, s) => a + s.similarity, 0) / mockSubmissions.length)
        : 0,
    }),
    [mockSubmissions],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return mockSubmissions
      .filter((s) => label === "all" || s.label === label)
      .filter((s) => !q || s.fileName.toLowerCase().includes(q) || s.studentName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "similarity"
          ? b.similarity - a.similarity
          : sort === "fileName"
            ? a.fileName.localeCompare(b.fileName)
            : b.uploadedAt.localeCompare(a.uploadedAt),
      );
  }, [query, label, sort, mockSubmissions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const chips: Array<{ id: LabelFilter; label: string; count: number }> = [
    { id: "all", label: "Tất cả", count: stats.total },
    { id: "plagiarism", label: "Cần xem lại", count: stats.plag },
    { id: "suspicious", label: "Nghi ngờ", count: stats.suspicious },
    { id: "innocent", label: "Không có dấu hiệu", count: stats.innocent },
  ];

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((value) => value !== id));
      return;
    }
    if (selected.length >= 2) {
      toast.info("Chỉ chọn được 2 bài", "Bỏ chọn một bài trước khi chọn bài khác để so sánh.");
      return;
    }
    setSelected([...selected, id]);
  };

  const compareSelected = () => {
    if (selected.length !== 2) {
      toast.error("Chưa đủ 2 bài", "Hãy chọn đúng 2 bài nộp để mở trang so sánh.");
      return;
    }
    const first = mockSubmissions.find((s) => s.id === selected[0]);
    const second = mockSubmissions.find((s) => s.id === selected[1]);
    if (!first || !second) return;
    navigate(`/compare?a=${encodeURIComponent(first.fileName)}&b=${encodeURIComponent(second.fileName)}`);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">CODEX / Kết quả</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">Kết quả quét đạo văn</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Danh sách bài nộp sau khi chuẩn hóa và so sánh. Chọn 2 bài bất kỳ để mở trang đối chiếu song song.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { k: "Tổng bài nộp", v: `${stats.total} bài` },
          { k: "Cần xem lại", v: `${stats.plag} bài` },
          { k: "Tương đồng trung bình", v: `${stats.avg}%` },
        ].map((s) => (
          <div key={s.k} className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-600">{s.k}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-stone-900">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Sticky toolbar: luôn giữ bộ lọc trong tầm mắt khi cuộn danh sách dài. */}
      <div
        className="sticky top-14 z-20 space-y-3 border border-stone-200 bg-[#f6f7f5]/95 p-4 shadow-sm shadow-stone-900/5 backdrop-blur dark:bg-[#111110]/95"
        style={{ borderRadius: 10 }}
      >
        <div className="flex flex-wrap items-center gap-2" data-guide="results-filter">
          {chips.map((chip) => {
            const active = label === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setLabel(chip.id);
                  setPage(1);
                }}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                {chip.label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? "bg-white/15" : "bg-stone-100 text-stone-600"}`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-600" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên file, sinh viên, mã SV..."
              className="w-full border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-800 focus:border-stone-900 focus:outline-none"
              style={{ borderRadius: 7 }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <FaSliders className="text-stone-600" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700"
              style={{ borderRadius: 7 }}
            >
              <option value="similarity">Tương đồng cao nhất</option>
              <option value="fileName">Tên file A–Z</option>
              <option value="uploadedAt">Mới nhất</option>
            </select>
          </label>
          <ItemsPerPageSelector value={perPage} onChange={(v) => { setPerPage(v); setPage(1); }} options={[5, 10, 25]} />

          {selected.length > 0 && (
            <div className="ml-auto flex flex-wrap items-center gap-2 border-l border-stone-200 pl-3" role="status">
              <span className="text-xs font-medium text-stone-600">
                {selected.length === 2 ? "Đã đủ 2 bài — bấm So sánh để mở." : `Đã chọn ${selected.length}/2 — chọn thêm ${2 - selected.length} bài nữa.`}
              </span>
              <button
                type="button"
                onClick={compareSelected}
                disabled={selected.length !== 2}
                data-guide="results-compare"
                className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaCodeCompare /> So sánh
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                aria-label="Bỏ chọn tất cả"
                className="rounded-md p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                <FaXmark size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {paged.map((s) => {
          const st = labelStyle[s.label];
          const isSelected = selected.includes(s.id);
          const pickOrder = selected.indexOf(s.id); // 0 = bài A, 1 = bài B
          const isLocked = !isSelected && selected.length >= 2; // đã đủ 2 bài → khung tắt/mờ
          return (
            <div
              key={s.id}
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isLocked}
              aria-label={`Chọn ${s.fileName} để so sánh`}
              tabIndex={isLocked ? -1 : 0}
              data-guide="results-select"
              title={isSelected ? "Bỏ chọn bài này" : isLocked ? "Đã đủ 2 bài, bỏ chọn một bài trước" : "Chọn để so sánh"}
              onClick={(event) => {
                // Bấm vào bất cứ đâu trong khung (trừ nút/link) đều bật/tắt chọn.
                if ((event.target as HTMLElement).closest("a, button")) return;
                toggleSelect(s.id);
              }}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  if (!isLocked) toggleSelect(s.id);
                }
              }}
              className={`relative flex flex-wrap cursor-pointer items-center gap-4 border transition-all duration-150 ${rowPad} ${
                isSelected
                  ? "border-amber-500 bg-amber-50 shadow-[0_2px_12px_rgba(245,158,11,0.18)] ring-2 ring-amber-400/70 dark:border-amber-400 dark:bg-amber-950/40 dark:ring-amber-500/60"
                  : isLocked
                    ? "border-stone-200 bg-white opacity-50 hover:border-stone-300 hover:opacity-70"
                    : selected.length > 0
                      ? "border-stone-200 bg-white opacity-75 hover:border-stone-300 hover:opacity-100"
                      : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
              }`}
              style={{ borderRadius: 10 }}
              aria-current={isSelected ? "true" : undefined}
            >
              {/* Vạch trái báo trạng thái */}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-3 bottom-3 w-1 rounded-full transition-colors ${
                  isSelected ? "bg-amber-500" : "bg-transparent"
                }`}
              />
              {/* Checkbox ẩn hoàn toàn — chọn bài bằng cách bấm vào khung (và phím Space/Enter khi focus). */}
              {isSelected && (
                <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                  {pickOrder === 0 ? "Bài A" : pickOrder === 1 ? "Bài B" : "Đã chọn"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-stone-900">
                  <Highlight text={s.fileName} query={query} />
                </p>
                <p className="mt-0.5 truncate text-xs text-stone-600">
                  <Highlight text={s.studentName} query={query} /> · <Highlight text={s.studentCode} query={query} /> · Lớp {s.className} · {s.language} · {s.size} · {s.uploadedAt}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.bg} ${st.text}`}>
                {labelName(s.label)}
              </span>
              <div className="w-44">
                <div className="mb-1.5 flex justify-between text-xs font-medium text-stone-600">
                  <span>Tương đồng</span>
                  <span className="text-stone-800">{s.similarity}%</span>
                </div>
                <div className="h-1.5 overflow-hidden bg-stone-100" style={{ borderRadius: 999 }}>
                  <div className={`h-full ${st.bar}`} style={{ width: `${s.similarity}%` }} />
                </div>
              </div>
              <Link
                to={`/compare?file=${encodeURIComponent(s.fileName)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                <FaCodeCompare /> So sánh
              </Link>
            </div>
          );
        })}
        {paged.length === 0 && (
          <EmptyState
            icon={<FaMagnifyingGlass size={16} />}
            title="Không tìm thấy bài nộp nào"
            description="Thử xoá bộ lọc trạng thái hoặc tìm với từ khoá khác."
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setLabel("all");
                  setPage(1);
                }}
                className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Xoá bộ lọc
              </button>
            }
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-600">Hiển thị {paged.length} / {filtered.length} bài nộp</p>
        <PaginationControl currentPage={safePage} totalPages={totalPages} onPageChange={setPage} prevLabel="Trước" nextLabel="Sau" ofPagesLabel="trên {total} trang" />
      </div>
    </div>
  );
}
