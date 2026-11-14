import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight, FaChartSimple, FaClock, FaCodeCompare, FaDownload, FaFileLines, FaRobot, FaTable, FaUpload } from "react-icons/fa6";
import type { Submission } from "../data/types";
import { sampleLibrary, type LibrarySample } from "../data/aiSampleLibrary";
import { useBackendData, languageFromFileName } from "../modules/lib/hook/backend-data-context";
import { analyzeCode, type Verdict } from "../modules/plagiarism/utils/aiClassify";
import { EmptyState } from "../modules/lib/Components/UI/feedback/StatePanel";
import InfoCard from "../modules/lib/Components/UI/cart/InfoCard";
import ClustersCard from "../modules/lib/Components/UI/cart/ClustersCard";
import SubmissionsList from "../modules/lib/Components/UI/list/submitlist";
import ExportButtons from "../modules/plagiarism/components/ExportButtons";
import { exportExcel, exportPdf, nowLabel, safeFileName } from "../modules/plagiarism/utils/export";
import { useToast } from "../modules/lib/Components/UI/feedback/Toast";

const levelDot: Record<string, string> = {
  high: "bg-red-600",
  warn: "bg-amber-500",
  ok: "bg-emerald-600",
};

const labelName = (label: Submission["label"]) =>
  label === "plagiarism" ? "Cần xem lại" : label === "suspicious" ? "Nghi ngờ" : "Không có dấu hiệu";

function DashboardDonut({ plag, suspicious, innocent }: { plag: number; suspicious: number; innocent: number }) {
  const total = plag + suspicious + innocent;
  const C = 2 * Math.PI * 60;
  const pctPlag = total > 0 ? plag / total : 0;
  const pctSusp = total > 0 ? suspicious / total : 0;
  return (
    <div className="border border-stone-200 bg-white p-5" style={{ borderRadius: 10 }}>
      <h3 className="text-sm font-semibold text-stone-900">Phân bố mức độ</h3>
      <p className="mt-1 text-xs text-stone-600">Tỉ lệ nhãn sau đợt quét câu lạc bộ mẫu.</p>
      <div className="mt-4 flex items-center gap-6">
        <svg viewBox="0 0 160 160" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label={`Biểu đồ tròn: Cần xem lại ${plag}, Nghi ngờ ${suspicious}, Sạch ${innocent}`}>
          <circle cx="80" cy="80" r="60" fill="none" strokeWidth="18" className="text-stone-100" stroke="currentColor" />
          <circle cx="80" cy="80" r="60" fill="none" strokeWidth="18" stroke="#dc2626" strokeDasharray={`${pctPlag * C} ${C}`} />
          <circle
            cx="80" cy="80" r="60" fill="none" strokeWidth="18" stroke="#f59e0b"
            strokeDasharray={`${pctSusp * C} ${C}`} strokeDashoffset={-pctPlag * C}
          />
        </svg>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Cần xem lại <strong>{plag} bài</strong></li>
          <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Nghi ngờ <strong>{suspicious} bài</strong></li>
          <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-stone-500" /> Không dấu hiệu <strong>{innocent} bài</strong></li>
          <li className="pt-1 text-xs text-stone-500">Tổng {total} bài nộp</li>
        </ul>
      </div>
      <Link to="/results" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900">
        Xem chi tiết <FaArrowRight className="text-xs" />
      </Link>
    </div>
  );
}

function DashboardBuckets({ submissions }: { submissions: Submission[] }) {
  const buckets = [
    { label: "0–40% (an toàn)", count: submissions.filter((s) => s.similarity < 40).length, bar: "bg-stone-500" },
    { label: "40–60%", count: submissions.filter((s) => s.similarity >= 40 && s.similarity < 60).length, bar: "bg-emerald-600" },
    { label: "60–80%", count: submissions.filter((s) => s.similarity >= 60 && s.similarity < 80).length, bar: "bg-amber-500" },
    { label: "80%+ (cần xem)", count: submissions.filter((s) => s.similarity >= 80).length, bar: "bg-red-600" },
  ];
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="border border-stone-200 bg-white p-5" style={{ borderRadius: 10 }}>
      <h3 className="text-sm font-semibold text-stone-900">Phân bố theo độ tương đồng</h3>
      <p className="mt-1 text-xs text-stone-600">Số bài trong từng khoảng %.</p>
      <div className="mt-4 space-y-3">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-xs text-stone-600"><span>{b.label}</span><strong className="text-stone-900">{b.count}</strong></div>
            <div className="mt-1 h-2.5 overflow-hidden bg-stone-100" style={{ borderRadius: 999 }} role="img" aria-label={`${b.label}: ${b.count} bài`}>
              <div className={`h-full ${b.bar} transition-all`} style={{ width: `${(b.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type AiKindFilter = "all" | LibrarySample["kind"];
type VerdictFilter = "all" | Verdict;
type AiSort = "newest" | "highest-ai" | "lowest-ai";
type AiView = "bars" | "table";
type StatsMode = "plagiarism" | "ai";

interface AiSampleStat {
  sample: LibrarySample;
  aiProbability: number;
  humanProbability: number;
  verdict: Verdict;
  confidence: number;
  language: string;
  codeLineCount: number;
  functionCount: number;
  signals: import("../modules/plagiarism/utils/aiClassify").Signal[];
}

const verdictName = (verdict: Verdict) =>
  verdict === "ai" ? "AI tạo" : verdict === "human" ? "Người viết" : "Chưa rõ";

const verdictDot = (verdict: Verdict) =>
  verdict === "ai"
    ? "bg-stone-900 ring-1 ring-stone-900"
    : verdict === "human"
      ? "bg-white ring-2 ring-stone-900"
      : "bg-stone-300 ring-1 ring-stone-300";

function AiStatsSection() {
  const toast = useToast();
  const { aiResults } = useBackendData();
  const [kindFilter, setKindFilter] = useState<AiKindFilter>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("all");
  const [minAi, setMinAi] = useState(0);
  const [sort, setSort] = useState<AiSort>("newest");
  const [view, setView] = useState<AiView>("bars");

  const stats = useMemo<AiSampleStat[]>(() => {
    const fromBackend = aiResults.map((result) => {
      const verdict: Verdict = result.prediction === "ai" ? "ai" : result.prediction === "human" ? "human" : "unclear";
      const confidence = result.confidence ?? 0;
      const aiProbability = verdict === "ai" ? confidence : verdict === "human" ? 1 - confidence : confidence;
      const humanProbability = verdict === "ai" ? 1 - confidence : verdict === "human" ? confidence : 1 - confidence;
      const sample: LibrarySample = {
        id: `be:${result.codeId}`,
        kind: verdict === "ai" ? "ai" : verdict === "human" ? "human" : "mixed",
        fileName: result.fileName,
        title: result.fileName,
        description: `BE · ${Math.round(confidence * 100)}% · ${result.suspiciousLineCount}/${result.totalLines} dòng nghiêng`,
        author: "",
        className: "",
        uploadedAt: "",
        code: "",
      };
      return {
        sample,
        aiProbability,
        humanProbability,
        verdict,
        confidence,
        language: languageFromFileName(result.fileName),
        codeLineCount: result.totalLines,
        functionCount: 0,
        signals: [],
      };
    });
    if (aiResults.length > 0) {
      return fromBackend;
    }
    return sampleLibrary.map((sample) => {
      const analysis = analyzeCode(sample.code);
      return {
        sample,
        aiProbability: analysis.aiProbability,
        humanProbability: analysis.humanProbability,
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        language: analysis.language,
        codeLineCount: analysis.codeLineCount,
        functionCount: analysis.functionCount,
        signals: analysis.signals,
      };
    });
  }, [aiResults]);

  const classOptions = useMemo(
    () => [...new Set(stats.map((item) => item.sample.className).filter((c) => c !== ""))].sort(),
    [stats],
  );

  const filtered = useMemo(() => {
    const list = stats.filter((item) => {
      if (kindFilter !== "all" && item.sample.kind !== kindFilter) return false;
      if (classFilter !== "all" && item.sample.className !== classFilter) return false;
      if (verdictFilter !== "all" && item.verdict !== verdictFilter) return false;
      if (item.aiProbability * 100 < minAi) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sort === "highest-ai"
        ? b.aiProbability - a.aiProbability
        : sort === "lowest-ai"
          ? a.aiProbability - b.aiProbability
          : b.sample.uploadedAt.localeCompare(a.sample.uploadedAt),
    );
  }, [stats, kindFilter, classFilter, verdictFilter, minAi, sort]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const ai = filtered.filter((item) => item.verdict === "ai").length;
    const human = filtered.filter((item) => item.verdict === "human").length;
    const unclear = filtered.filter((item) => item.verdict === "unclear").length;
    const avgAi = total > 0 ? Math.round((filtered.reduce((sum, item) => sum + item.aiProbability, 0) / total) * 100) : 0;
    const avgConfidence = total > 0 ? Math.round((filtered.reduce((sum, item) => sum + item.confidence, 0) / total) * 100) : 0;
    return { total, ai, human, unclear, avgAi, avgConfidence };
  }, [filtered]);

  const C = 2 * Math.PI * 60;
  const pctAi = summary.total > 0 ? summary.ai / summary.total : 0;
  const pctHuman = summary.total > 0 ? summary.human / summary.total : 0;

  const aiBuckets = useMemo(() => {
    const low = filtered.filter((item) => item.aiProbability <= 0.35).length;
    const mid = filtered.filter((item) => item.aiProbability > 0.35 && item.aiProbability < 0.65).length;
    const high = filtered.filter((item) => item.aiProbability >= 0.65).length;
    const max = Math.max(1, low, mid, high);
    return [
      { label: "0–35% (người viết)", count: low, bar: "bg-stone-200", width: (low / max) * 100 },
      { label: "35–65% (chưa rõ)", count: mid, bar: "bg-stone-400", width: (mid / max) * 100 },
      { label: "65–100% (AI tạo)", count: high, bar: "bg-stone-900", width: (high / max) * 100 },
    ];
  }, [filtered]);

  const topSignals = useMemo(() => {
    const map = new Map<string, { count: number; weight: number; label: string }>();
    for (const item of filtered) {
      for (const signal of item.signals) {
        const current = map.get(signal.key) ?? { count: 0, weight: 0, label: signal.label };
        current.count += 1;
        current.weight += signal.weight;
        map.set(signal.key, current);
      }
    }
    return [...map.values()]
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
      .slice(0, 5);
  }, [filtered]);

  const handleAiExcel = async () => {
    await exportExcel(safeFileName("codex-thong-ke-ai", "xlsx"), [
      {
        name: "Thong ke AI",
        columns: [
          { header: "Tệp", key: "file", width: 20 },
          { header: "Loại mẫu", key: "kind", width: 12 },
          { header: "Lớp", key: "className", width: 10 },
          { header: "Ngày nạp", key: "uploadedAt", width: 12 },
          { header: "Ngôn ngữ", key: "language", width: 12 },
          { header: "AI (%)", key: "ai", width: 10 },
          { header: "Người (%)", key: "human", width: 10 },
          { header: "Kết luận", key: "verdict", width: 16 },
          { header: "Chắc chắn (%)", key: "confidence", width: 12 },
          { header: "Dòng mã", key: "lines", width: 10 },
          { header: "Số hàm", key: "functions", width: 10 },
        ],
        rows: filtered.map((item) => ({
          file: item.sample.fileName,
          kind: item.sample.kind === "ai" ? "AI" : item.sample.kind === "human" ? "Người viết" : "Hỗn hợp",
          className: item.sample.className,
          uploadedAt: item.sample.uploadedAt,
          language: item.language,
          ai: Math.round(item.aiProbability * 100),
          human: Math.round(item.humanProbability * 100),
          verdict: verdictName(item.verdict),
          confidence: Math.round(item.confidence * 100),
          lines: item.codeLineCount,
          functions: item.functionCount,
        })),
      },
    ]);
    toast.success("Đã xuất thống kê AI", "File .xlsx gồm danh sách tệp đang lọc đã được tải xuống.");
  };

  const selectClass =
    "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 focus:border-stone-900 focus:outline-none";

  return (
    <section className="border border-stone-200 bg-white p-5" style={{ borderRadius: 10 }} aria-labelledby="ai-stats-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ai-stats-title" className="flex items-center gap-2 text-base font-semibold text-stone-900">
            <FaRobot className="text-stone-500" /> Thống kê AI / người viết
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-600">
            Tính trực tiếp từ {stats.length} tệp có dữ liệu trên backend bằng các chỉ số phân tích AI.
            Dùng bộ lọc bên dưới để thu hẹp theo loại, lớp, kết luận và ngưỡng AI. Nội dung dưới đây là trang thống kê AI đầy đủ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleAiExcel()}
            className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
            title="Xuất danh sách tệp AI đang lọc ra Excel"
          >
            <FaDownload /> Xuất Excel
          </button>
          <Link
            to="/ai-detect/kho-mau"
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Mở kho mẫu AI <FaArrowRight className="text-xs" />
          </Link>
        </div>
      </div>

      {/* Thẻ tóm tắt AI — tông đen/trắng trực quan */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Tổng tệp mẫu</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-stone-900">{summary.total} tệp</p>
          <p className="mt-1 text-xs text-stone-600">Trong kho {stats.length} tệp đang lọc</p>
        </div>
        <div className="border border-stone-900 bg-stone-900 p-4" style={{ borderRadius: 10 }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-white">AI tạo — nền đen</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-white">{summary.ai} tệp</p>
          <p className="mt-1 text-xs text-stone-300">Xác suất AI TB {summary.avgAi}%</p>
        </div>
        <div className="border-2 border-stone-900 bg-white p-4" style={{ borderRadius: 10 }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-900">Người viết — nền trắng viền đen</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-stone-900">{summary.human} tệp</p>
          <p className="mt-1 text-xs text-stone-600">Chưa rõ {summary.unclear} tệp</p>
        </div>
        <div className="border border-stone-200 bg-stone-50 p-4" style={{ borderRadius: 10 }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Độ chắc chắn TB</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-stone-900">{summary.avgConfidence}%</p>
          <p className="mt-1 text-xs text-stone-600">Trung bình của các tệp đang hiện</p>
        </div>
      </div>

      {/* Options cho thống kê AI */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-guide="dashboard-ai-filters">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-600">Loại mẫu</span>
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as AiKindFilter)} className={`${selectClass} w-full`} aria-label="Lọc theo loại mẫu">
            <option value="all">Tất cả (AI / Người / Hỗn hợp)</option>
            <option value="ai">AI mẫu</option>
            <option value="human">Người viết</option>
            <option value="mixed">Hỗn hợp</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-600">Lớp</span>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={`${selectClass} w-full`} aria-label="Lọc theo lớp">
            <option value="all">Tất cả lớp</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>Lớp {c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-600">Kết luận</span>
          <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value as VerdictFilter)} className={`${selectClass} w-full`} aria-label="Lọc theo kết luận">
            <option value="all">Tất cả kết luận</option>
            <option value="ai">AI tạo</option>
            <option value="human">Người viết</option>
            <option value="unclear">Chưa rõ</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-600">Sắp xếp</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as AiSort)} className={`${selectClass} w-full`} aria-label="Sắp xếp danh sách AI">
            <option value="newest">Mới nhất</option>
            <option value="highest-ai">AI cao nhất</option>
            <option value="lowest-ai">AI thấp nhất</option>
          </select>
        </label>
        <div>
          <label htmlFor="ai-min" className="mb-1 block text-xs font-semibold text-stone-600">
            Ngưỡng AI tối thiểu: <span className="text-stone-900">{minAi}%</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="ai-min"
              type="range"
              min={0}
              max={100}
              step={5}
              value={minAi}
              onChange={(e) => setMinAi(Number(e.target.value))}
              className="w-full flex-1 accent-stone-900"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={minAi}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) setMinAi(Math.max(0, Math.min(100, v)));
              }}
              className="w-20 rounded-md border border-stone-300 bg-white px-2 py-1.5 text-center text-sm font-semibold text-stone-900 focus:border-stone-900 focus:outline-none"
              aria-label="Ngưỡng AI tối thiểu (số)"
            />
          </div>
          <p className="mt-1 text-xs text-stone-500">Chỉ hiện tệp có xác suất AI ≥ ngưỡng.</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-stone-900 bg-white p-3" role="status" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Kết quả đang lọc — đen = AI, trắng viền đen = Người, xám = Chưa rõ</p>
        <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-300">
          {summary.total} tệp đang hiển thị
        </span>
        <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white ring-1 ring-stone-900">
          AI tạo: {summary.ai}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-900 ring-2 ring-stone-900">
          Người viết: {summary.human}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-300">
          Chưa rõ: {summary.unclear}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-900 ring-1 ring-stone-900">
          TB AI {summary.avgAi}% · Độ chắc chắn TB {summary.avgConfidence}%
        </span>
        {(kindFilter !== "all" || classFilter !== "all" || verdictFilter !== "all" || minAi > 0) && (
          <button
            type="button"
            onClick={() => {
              setKindFilter("all");
              setClassFilter("all");
              setVerdictFilter("all");
              setMinAi(0);
              setSort("newest");
            }}
            className="rounded-full border border-stone-900 bg-white px-3 py-1 text-xs font-semibold text-stone-900 hover:bg-stone-900 hover:text-white"
          >
            Xoá bộ lọc
          </button>
        )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1" role="group" aria-label="Chế độ xem danh sách AI">
              {(
                [
                  { id: "bars" as const, label: "Thanh", icon: FaChartSimple },
                  { id: "table" as const, label: "Bảng", icon: FaTable },
                ]
              ).map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                      active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    <Icon size={11} /> {item.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500">Bấm vào tên tệp để mở trang phân tích chi tiết 34 chỉ số.</p>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-5">
          <div className="flex items-center gap-6 lg:col-span-2">
            <svg
              viewBox="0 0 160 160"
              className="h-32 w-32 shrink-0 -rotate-90"
              role="img"
              aria-label={`Biểu đồ tròn AI: AI tạo ${summary.ai}, Người viết ${summary.human}, Chưa rõ ${summary.unclear}`}
            >
              <circle cx="80" cy="80" r="60" fill="none" strokeWidth="18" className="text-stone-100" stroke="currentColor" />
              <circle cx="80" cy="80" r="60" fill="none" strokeWidth="18" stroke="#1c1917" strokeDasharray={`${pctAi * C} ${C}`} />
              <circle
                cx="80" cy="80" r="60" fill="none" strokeWidth="18" stroke="#a8a29e"
                strokeDasharray={`${pctHuman * C} ${C}`} strokeDashoffset={-pctAi * C}
              />
            </svg>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Đọc nhanh</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">Chấm đen = AI, chấm trắng viền đen = Người, xám = Chưa rõ.</p>
              <ul className="mt-2 space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-stone-900" /> AI tạo <strong>{summary.ai} tệp</strong></li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-stone-900" /> Người viết <strong>{summary.human} tệp</strong></li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-stone-300" /> Chưa rõ <strong>{summary.unclear} tệp</strong></li>
                <li className="pt-1 text-xs text-stone-500">Nhóm hỗn hợp thường rơi vào &ldquo;Chưa rõ&rdquo;.</li>
              </ul>
              <div className="mt-4 border-t border-stone-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Theo khoảng AI</p>
                <div className="mt-2 space-y-2">
                  {aiBuckets.map((bucket) => (
                    <div key={bucket.label}>
                      <div className="flex justify-between text-xs text-stone-600"><span>{bucket.label}</span><strong className="text-stone-900">{bucket.count}</strong></div>
                      <div className="mt-1 h-2 overflow-hidden bg-stone-100" style={{ borderRadius: 999 }}>
                        <div className={`h-full ${bucket.bar}`} style={{ width: `${bucket.width}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {view === "bars" ? (
              <div className="space-y-2.5">
              {filtered.map((item) => (
                <div key={item.sample.id} className="flex flex-wrap items-center gap-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${verdictDot(item.verdict)}`} />
                  <Link
                    to={`/ai-detect/analyze?mau=${item.sample.id}`}
                    className="min-w-0 flex-1 font-mono text-xs font-semibold text-stone-800 hover:underline hover:text-stone-900"
                    title={`${item.sample.title} — ${verdictName(item.verdict)}`}
                  >
                    {item.sample.fileName}
                    <span className="ml-2 font-sans font-normal text-stone-500">· {item.sample.className} · {item.sample.uploadedAt}</span>
                  </Link>
                  <span className="hidden w-28 sm:block">
                    <span className="block h-2 overflow-hidden bg-stone-100 ring-1 ring-stone-200" style={{ borderRadius: 999 }} role="img" aria-label={`Xác suất AI ${Math.round(item.aiProbability * 100)}%`}>
                      <span
                        className={`block h-full ${item.verdict === "ai" ? "bg-stone-900" : item.verdict === "human" ? "bg-white ring-1 ring-stone-900" : "bg-stone-400"}`}
                        style={{ width: `${Math.round(item.aiProbability * 100)}%` }}
                      />
                    </span>
                  </span>
                  <span className="w-28 shrink-0 text-right text-xs font-bold text-stone-800">
                    AI {Math.round(item.aiProbability * 100)}% · {verdictName(item.verdict)}
                  </span>
                </div>
              ))}
              </div>
            ) : (
              <div className="overflow-auto border border-stone-200" style={{ borderRadius: 8 }}>
                <table className="w-full min-w-[720px] border-collapse text-xs">
                  <caption className="p-3 text-left text-stone-600">Bảng chi tiết thống kê AI của {summary.total} tệp đang lọc.</caption>
                  <thead>
                    <tr className="bg-stone-50 text-left text-stone-600">
                      <th className="px-3 py-2">Tệp</th>
                      <th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Lớp · Ngày</th>
                      <th className="px-3 py-2">Ngôn ngữ</th>
                      <th className="px-3 py-2 text-right">AI %</th>
                      <th className="px-3 py-2">Kết luận</th>
                      <th className="px-3 py-2 text-right">Chắc chắn</th>
                      <th className="px-3 py-2 text-right">Dòng · Hàm</th>
                      <th className="px-3 py-2">Mở</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.sample.id} className="border-t border-stone-100 align-top">
                        <td className="px-3 py-2">
                          <span className="font-mono font-semibold text-stone-800">{item.sample.fileName}</span>
                          <span className="block max-w-[220px] truncate text-stone-500">{item.sample.title}</span>
                          <span className="block max-w-[220px] truncate text-stone-400">{item.signals?.[0]?.label ?? item.sample.description}</span>
                        </td>
                        <td className="px-3 py-2">{item.sample.kind === "ai" ? "AI" : item.sample.kind === "human" ? "Người viết" : "Hỗn hợp"}</td>
                        <td className="px-3 py-2">{item.sample.className}<span className="block text-stone-500">{item.sample.uploadedAt}</span></td>
                        <td className="px-3 py-2 font-mono">{item.language}</td>
                        <td className="px-3 py-2 text-right font-bold">{Math.round(item.aiProbability * 100)}%</td>
                        <td className="px-3 py-2"><span className={`inline-flex items-center gap-1.5 font-semibold`}><span className={`h-2 w-2 rounded-full ${verdictDot(item.verdict)}`} />{verdictName(item.verdict)}</span></td>
                        <td className="px-3 py-2 text-right">{Math.round(item.confidence * 100)}%</td>
                        <td className="px-3 py-2 text-right">{item.codeLineCount} · {item.functionCount}</td>
                        <td className="px-3 py-2">
                          <Link to={`/ai-detect/analyze?mau=${item.sample.id}`} className="font-semibold text-stone-700 hover:text-stone-900">Phân tích</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>

          {topSignals.length > 0 && (
            <div className="mt-5 border-t border-stone-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Tín hiệu nổi bật trong các tệp đang lọc</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                {topSignals.map((signal) => (
                  <div key={signal.label} className={`border px-3 py-2 ${signal.weight > 0 ? "border-stone-900 bg-stone-900" : "border-stone-300 bg-white"}`} style={{ borderRadius: 8 }}>
                    <p className={`truncate text-xs font-semibold ${signal.weight > 0 ? "text-white" : "text-stone-800"}`} title={signal.label}>{signal.label}</p>
                    <p className={`mt-1 text-xs ${signal.weight > 0 ? "text-stone-300" : "text-stone-600"}`}>Xuất hiện {signal.count} lần</p>
                    <p className={`mt-1 text-xs font-bold ${signal.weight > 0 ? "text-white" : "text-stone-900"}`}>
                      {signal.weight > 0 ? "■ Nghiêng AI" : "□ Nghiêng người viết"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="Không có tệp mẫu nào khớp bộ lọc"
            description="Hãy giảm ngưỡng AI hoặc xoá bộ lọc để xem toàn bộ kho mẫu."
            action={
              <button
                type="button"
                onClick={() => {
                  setKindFilter("all");
                  setClassFilter("all");
                  setVerdictFilter("all");
                  setMinAi(0);
                }}
                className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Xoá bộ lọc
              </button>
            }
          />
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  // Nguồn dữ liệu THẬT từ backend (UI giữ nguyên 100%).
  const {
    submissions: mockSubmissions,
    pairs: pairRelations,
    activity: recentActivity,
    clusters,
    studentCount,
  } = useBackendData();
  const [statsMode, setStatsMode] = useState<StatsMode>("plagiarism");
  const plag = mockSubmissions.filter((s) => s.label === "plagiarism").length;
  const suspicious = mockSubmissions.filter((s) => s.label === "suspicious").length;
  const innocent = mockSubmissions.filter((s) => s.label === "innocent").length;
  const highest = mockSubmissions.length > 0 ? Math.max(...mockSubmissions.map((s) => s.similarity)) : 0;
  const average =
    mockSubmissions.length > 0
      ? Math.round(mockSubmissions.reduce((a, s) => a + s.similarity, 0) / mockSubmissions.length)
      : 0;
  const sorted = [...mockSubmissions].sort((a, b) => b.similarity - a.similarity);

  const handleExcel = async () => {
    await exportExcel(safeFileName("codex-bao-cao-tong-quan", "xlsx"), [
      {
        name: "Tong quan",
        columns: [
          { header: "Chỉ số", key: "k", width: 28 },
          { header: "Giá trị", key: "v", width: 34 },
        ],
        rows: [
          { k: "Tổng bài nộp", v: mockSubmissions.length },
          { k: "Cần xem lại", v: plag },
          { k: "Nghi ngờ", v: suspicious },
          { k: "Không có dấu hiệu", v: innocent },
          { k: "Tương đồng trung bình (%)", v: average },
          { k: "Tương đồng cao nhất (%)", v: highest },
          { k: "Số cặp tương đồng", v: pairRelations.length },
          { k: "Xuất lúc", v: nowLabel() },
        ],
      },
      {
        name: "Bai nop",
        columns: [
          { header: "STT", key: "stt", width: 6 },
          { header: "Tệp", key: "file", width: 14 },
          { header: "Sinh viên", key: "student", width: 24 },
          { header: "Mã SV", key: "studentCode", width: 14 },
          { header: "Lớp", key: "className", width: 10 },
          { header: "Ngôn ngữ", key: "language", width: 11 },
          { header: "Trạng thái", key: "status", width: 18 },
          { header: "Tương đồng (%)", key: "similarity", width: 15 },
          { header: "Ngày nộp", key: "uploadedAt", width: 12 },
          { header: "Kích thước", key: "size", width: 11 },
        ],
        rows: sorted.map((s, i) => ({
          stt: i + 1,
          file: s.fileName,
          student: s.studentName,
          studentCode: s.studentCode,
          className: s.className,
          language: s.language,
          status: labelName(s.label),
          similarity: s.similarity,
          uploadedAt: s.uploadedAt,
          size: s.size,
        })),
      },
      {
        name: "Cap tuong dong",
        columns: [
          { header: "STT", key: "stt", width: 6 },
          { header: "Bài A", key: "aName", width: 14 },
          { header: "Sinh viên A", key: "aStudent", width: 24 },
          { header: "Bài B", key: "bName", width: 14 },
          { header: "Sinh viên B", key: "bStudent", width: 24 },
          { header: "Tương đồng (%)", key: "similarity", width: 15 },
        ],
        rows: pairRelations.map((p, i) => ({
          stt: i + 1,
          aName: p.aName,
          aStudent: p.aStudent,
          bName: p.bName,
          bStudent: p.bStudent,
          similarity: p.similarity,
        })),
      },
    ]);
    toast.success("Đã xuất báo cáo Excel", "File .xlsx gồm 3 sheet đã được tải xuống.");
  };

  const handlePdf = () => {
    const ok = exportPdf({
      fileName: safeFileName("codex-bao-cao-tong-quan", "pdf"),
      title: "Báo cáo tổng quan đợt quét đạo văn",
      subtitle: "Tổng hợp kết quả quét và các cặp bài có mức tương đồng cao.",
      meta: [
        { label: "Phạm vi", value: `${mockSubmissions.length} bài nộp` },
        { label: "Ngưỡng cảnh báo", value: "≥ 80% tương đồng" },
      ],
      summary: [
        { label: "Tổng bài nộp", value: `${mockSubmissions.length}` },
        { label: "Cần xem lại", value: `${plag}`, tone: "danger" },
        { label: "Nghi ngờ", value: `${suspicious}`, tone: "warn" },
        { label: "Không dấu hiệu", value: `${innocent}`, tone: "ok" },
        { label: "Tương đồng TB", value: `${average}%` },
        { label: "Cao nhất", value: `${highest}%` },
      ],
      tables: [
        {
          title: "Các cặp bài tương đồng cao",
          columns: ["STT", "Bài A", "Sinh viên A", "Bài B", "Sinh viên B", "Tương đồng"],
          align: ["right", "left", "left", "left", "left", "right"],
          rows: pairRelations.map((p, i) => [
            String(i + 1),
            p.aName,
            p.aStudent,
            p.bName,
            p.bStudent,
            `${p.similarity}%`,
          ]),
          note: "Sắp xếp theo mức tương đồng giảm dần.",
        },
        {
          title: "Danh sách bài nộp",
          columns: ["STT", "Tệp", "Sinh viên", "Mã SV", "Lớp", "Tương đồng", "Trạng thái"],
          align: ["right", "left", "left", "left", "left", "right", "left"],
          rows: sorted.map((s, i) => [
            String(i + 1),
            s.fileName,
            s.studentName,
            s.studentCode,
            s.className,
            `${s.similarity}%`,
            labelName(s.label),
          ]),
        },
      ],
      footerNote: "CODEX · Báo cáo tổng quan đợt quét",
    });

    if (!ok) {
      toast.error(
        "Không mở được bản in",
        "Trình duyệt đã chặn cửa sổ in. Hãy cho phép popup của trang rồi thử lại.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">CODEX / Tổng quan</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">Tổng quan đợt quét</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
            Theo dõi số bài nộp, mức tương đồng cao nhất và các nhóm bài cần xem lại trước khi chấm.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" data-guide="dashboard-export">
          <ExportButtons onExcel={handleExcel} onPdf={handlePdf} />
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            <FaUpload /> Nạp bài nộp
          </Link>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <FaCodeCompare /> So sánh
          </Link>
        </div>
      </div>

      {/* Option chọn phần thống kê: Đạo văn | AI — không xoá nội dung, mỗi phần hiện đầy đủ */}
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="group"
        aria-label="Chọn phần thống kê"
        data-guide="dashboard-stats-mode"
      >
        <button
          type="button"
          onClick={() => setStatsMode("plagiarism")}
          aria-pressed={statsMode === "plagiarism"}
          className={`border p-4 text-left transition ${
            statsMode === "plagiarism"
              ? "border-stone-900 bg-stone-900 text-white shadow-sm"
              : "border-stone-200 bg-white text-stone-800 hover:border-stone-300"
          }`}
          style={{ borderRadius: 10 }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <FaFileLines size={14} /> Thống kê đạo văn
          </span>
          <span className={`mt-1 block text-xs leading-relaxed ${statsMode === "plagiarism" ? "text-stone-300" : "text-stone-600"}`}>
            {mockSubmissions.length} bài nộp · {plag} cần xem lại · TB {average}% · cao nhất {highest}%
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStatsMode("ai")}
          aria-pressed={statsMode === "ai"}
          className={`border p-4 text-left transition ${
            statsMode === "ai"
              ? "border-2 border-stone-900 bg-white text-stone-900 shadow-sm"
              : "border-stone-200 bg-white text-stone-800 hover:border-stone-900"
          }`}
          style={{ borderRadius: 10 }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${statsMode === "ai" ? "bg-stone-900 text-white" : "bg-stone-900 text-white"}`}>
              <FaRobot size={12} />
            </span>
            Thống kê AI
          </span>
          <span className={`mt-1 block text-xs leading-relaxed ${statsMode === "ai" ? "text-stone-600" : "text-stone-600"}`}>
              {sampleLibrary.length} tệp mẫu · 34 chỉ số tĩnh · lọc theo loại, lớp, kết luận và ngưỡng AI
          </span>
          <span className="mt-2 block text-xs font-bold">
            {statsMode === "ai" ? "● Đang chọn — nền trắng, viền đen" : "○ Bấm để mở trang thống kê AI (đen–trắng)"}
          </span>
        </button>
      </div>

      {statsMode === "ai" ? (
        <>
          <AiStatsSection />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { to: "/ai-detect/kho-mau", title: "Kho mẫu hệ thống", desc: "Duyệt toàn bộ tệp mẫu AI, người viết và hỗn hợp." },
              { to: "/ai-detect/cum", title: "Mô hình cụm", desc: "Xem cụm mẫu để hiểu xu hướng viết của từng nhóm." },
              { to: "/ai-detect/analyze?mau=custom", title: "Phân tích mã của tôi", desc: "Nạp file hoặc dán code để chấm ngay trên trình duyệt." },
            ].map((c) => (
              <Link key={c.to} to={c.to} className="group border border-stone-200 bg-white p-5 transition hover:border-stone-900" style={{ borderRadius: 10 }}>
                <h3 className="font-semibold text-stone-900">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{c.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-900">
                  Mở <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Tổng bài nộp" value={mockSubmissions.length} valueSuffix="bài" showLink={false} />
        <InfoCard title="Cần xem lại" value={plag} valueSuffix="bài" valueColor="text-red-700" showLink={false} />
        <InfoCard title="Tương đồng cao nhất" value={highest} valueSuffix="%" showLink={false} />
        <InfoCard title="Sinh viên" value={studentCount} valueSuffix="người" showLink={false} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardDonut plag={plag} suspicious={suspicious} innocent={innocent} />
        <DashboardBuckets submissions={mockSubmissions} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SubmissionsList
            submissions={mockSubmissions.map((s) => ({ id: s.id, fileName: s.fileName, label: s.label, similarity: s.similarity }))}
            maxDisplayItems={6}
            plagiarismColor="text-red-700"
            innocentColor="text-stone-700"
            cardBgColor="bg-white"
            onViewAllClick={() => navigate("/results")}
          />
        </div>
        <div className="space-y-6">
          <ClustersCard
            clusters={clusters}
            maxDisplayClusters={4}
            cardBgColor="bg-white"
            clusterBgColor="bg-stone-900"
            onViewAllClick={() => navigate("/relations")}
            onClusterClick={() => navigate("/relations")}
          />
          <div className="border border-stone-200 bg-white p-5" style={{ borderRadius: 10 }}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <FaClock className="text-stone-500" /> Hoạt động gần đây
            </h3>
            <ul className="mt-4 space-y-4">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${levelDot[a.level]}`} />
                  <span>
                    <span className="block leading-relaxed text-stone-700">{a.text}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{a.time}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/upload", title: "Nạp bài nộp mới", desc: "Tải lên file, thư mục hoặc zip để chạy một đợt quét." },
          { to: "/compare", title: "So sánh hai đoạn code", desc: "Đối chiếu trực tiếp và xem chỗ giống, chỗ khác." },
          { to: "/results", title: "Xem kết quả chi tiết", desc: "Lọc theo nhãn, tìm kiếm và sắp xếp theo mức tương đồng." },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="group border border-stone-200 bg-white p-5 transition hover:border-stone-300" style={{ borderRadius: 10 }}>
            <h3 className="font-semibold text-stone-900">{c.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{c.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-900">
              Mở <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
