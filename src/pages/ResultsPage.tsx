import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCodeCompare, FaMagnifyingGlass, FaSliders } from "react-icons/fa6";
import { mockSubmissions, type Submission } from "../data/mock";
import PaginationControl from "../modules/lib/Components/UI/Pagination/PaginationControl";
import ItemsPerPageSelector from "../modules/lib/Components/UI/Selector/ItemsPerPageSelector";

type SortKey = "similarity" | "fileName" | "uploadedAt";
type LabelFilter = "all" | Submission["label"];

const labelStyle: Record<Submission["label"], { text: string; bg: string; bar: string }> = {
  plagiarism: { text: "text-red-700", bg: "bg-red-50 ring-red-200", bar: "bg-red-600" },
  suspicious: { text: "text-amber-800", bg: "bg-amber-50 ring-amber-200", bar: "bg-amber-500" },
  innocent: { text: "text-stone-700", bg: "bg-stone-100 ring-stone-200", bar: "bg-stone-500" },
};

const labelName = (label: Submission["label"]) =>
  label === "plagiarism" ? "Cần xem lại" : label === "suspicious" ? "Nghi ngờ" : "Không có dấu hiệu";

export default function ResultsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<LabelFilter>("all");
  const [sort, setSort] = useState<SortKey>("similarity");

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
  }, [query, label, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const stats = useMemo(
    () => ({
      total: mockSubmissions.length,
      plag: mockSubmissions.filter((s) => s.label === "plagiarism").length,
      avg: Math.round(mockSubmissions.reduce((a, s) => a + s.similarity, 0) / mockSubmissions.length),
    }),
    [],
  );

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-200 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">CODEX / Kết quả</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">Kết quả quét đạo văn</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Danh sách bài nộp sau khi chuẩn hóa và so sánh. Mở mục So sánh để xem hai bài cụ thể.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { k: "Tổng bài nộp", v: `${stats.total} bài` },
          { k: "Cần xem lại", v: `${stats.plag} bài` },
          { k: "Tương đồng trung bình", v: `${stats.avg}%` },
        ].map((s) => (
          <div key={s.k} className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{s.k}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-stone-900">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
        <div className="relative min-w-[220px] flex-1">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400" />
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
        <select
          value={label}
          onChange={(e) => {
            setLabel(e.target.value as LabelFilter);
            setPage(1);
          }}
          className="border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700"
          style={{ borderRadius: 7 }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="plagiarism">Cần xem lại</option>
          <option value="suspicious">Nghi ngờ</option>
          <option value="innocent">Không có dấu hiệu</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
          <FaSliders className="text-stone-400" />
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
      </div>

      <div className="space-y-3">
        {paged.map((s) => {
          const st = labelStyle[s.label];
          return (
            <div key={s.id} className="flex flex-wrap items-center gap-4 border border-stone-200 bg-white p-4 transition hover:border-stone-300" style={{ borderRadius: 10 }}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-stone-900">{s.fileName}</p>
                <p className="mt-0.5 truncate text-xs text-stone-500">
                  {s.studentName} · {s.studentCode} · Lớp {s.className} · {s.language} · {s.size} · {s.uploadedAt}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.bg} ${st.text}`}>
                {labelName(s.label)}
              </span>
              <div className="w-44">
                <div className="mb-1.5 flex justify-between text-[11px] font-medium text-stone-500">
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
          <div className="border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500" style={{ borderRadius: 10 }}>
            Không tìm thấy bài nộp nào khớp bộ lọc.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-500">Hiển thị {paged.length} / {filtered.length} bài nộp</p>
        <PaginationControl currentPage={safePage} totalPages={totalPages} onPageChange={setPage} prevLabel="Trước" nextLabel="Sau" ofPagesLabel="trên {total} trang" />
      </div>
    </div>
  );
}
