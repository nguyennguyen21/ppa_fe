import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaArrowRight,
  FaCode,
  FaMagnifyingGlass,
  FaRobot,
  FaUser,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import type { LibrarySample, SampleKind } from "../data/aiSampleTypes";
import { useBackendData } from "../shared/hook/backend-data-context";
import {
  analyzeCode,
  analyzeLine,
  type AnalysisResult,
} from "../features/plagiarism/utils/aiClassify";

const kindMeta = {
  ai: {
    label: "AI tạo",
    icon: FaRobot,
    bar: "bg-amber-400",
    chip: "bg-amber-50 text-amber-800 ring-amber-200",
    iconStyle: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  human: {
    label: "Người viết",
    icon: FaUser,
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    iconStyle: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  mixed: {
    label: "Hỗn hợp",
    icon: FaWandMagicSparkles,
    bar: "bg-stone-400",
    chip: "bg-stone-100 text-stone-700 ring-stone-200",
    iconStyle: "bg-stone-100 text-stone-700 ring-stone-200",
  },
} as const;

type Filter = "all" | SampleKind;

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "ai", label: "AI tạo" },
  { id: "human", label: "Người viết" },
  { id: "mixed", label: "Hỗn hợp" },
];

const verdictChip = (analysis: AnalysisResult) => {
  if (analysis.verdict === "ai") {
    return {
      text: `${Math.round(analysis.aiProbability * 100)}% AI`,
      className: "bg-amber-50 text-amber-800 ring-amber-200",
    };
  }
  if (analysis.verdict === "human") {
    return {
      text: `${Math.round(analysis.humanProbability * 100)}% người viết`,
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    };
  }
  return {
    text: `${Math.round(analysis.aiProbability * 100)}% AI · chưa rõ`,
    className: "bg-stone-100 text-stone-700 ring-stone-200",
  };
};

const previewLines = (code: string) =>
  code.replace(/\s+$/, "").split("\n").slice(0, 7);

function SampleCard({ sample, code }: { sample: LibrarySample; code?: string }) {
  const meta = kindMeta[sample.kind];
  const Icon = meta.icon;
  const content = code ?? sample.code;
  const analysis = useMemo(() => analyzeCode(content), [content]);
  const verdict = verdictChip(analysis);
  const preview = previewLines(content);
  const lineTones = useMemo(
    () => preview.map((line, index) => analyzeLine(line, analysis.language, index + 1).tone),
    [preview, analysis.language],
  );

  return (
    <Link
      to={`/ai-detect/analyze?mau=${sample.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
    >
      <span className={`h-1.5 w-full ${meta.bar}`} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.chip}`}
          >
            <Icon size={10} /> {meta.label}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${verdict.className}`}>
            {verdict.text}
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2.5">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.iconStyle}`}
          >
            <Icon size={14} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-serif text-[17px] font-semibold leading-tight text-stone-900">
              {sample.title}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-stone-500">
              {sample.fileName} · {sample.className} · {sample.uploadedAt}
            </p>
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-stone-600">
          {sample.description}
        </p>

        <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          <pre className="h-[122px] overflow-hidden px-3 py-2 font-mono text-xs leading-[1.65]">
            {preview.map((line, index) => (
              <div
                key={index}
                className={`flex gap-1.5 ${
                  line.trim() === "" ? "text-transparent" : "text-stone-700"
                }`}
              >
                <span
                  className={`mt-[5px] h-1 w-1 shrink-0 rounded-full ${
                    lineTones[index] === "ai"
                      ? "bg-amber-500"
                      : lineTones[index] === "human"
                        ? "bg-emerald-500"
                        : "bg-stone-300"
                  }`}
                />
                <span className="truncate">{line || " "}</span>
              </div>
            ))}
          </pre>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-xs text-stone-600">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>
              <span className="font-semibold text-stone-700">{analysis.metrics.totalLines}</span> dòng
            </span>
            <span>
              <span className="font-semibold text-stone-700">{analysis.functionCount}</span> hàm
            </span>
            <span>
              <span className="font-semibold text-stone-700">
                {Math.round(analysis.metrics.commentRatio * 100)}%
              </span>{" "}
              chú thích
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-stone-900">
            Phân tích
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function AiSampleLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = searchParams.get("loai");
  const activeFilter: Filter =
    rawFilter === "ai" || rawFilter === "human" || rawFilter === "mixed" ? rawFilter : "all";
  const [query, setQuery] = useState("");

  const { aiResults, getSnippetCode } = useBackendData();
  const [beCodes, setBeCodes] = useState<Record<string, string>>({});

  const beSamples = useMemo<LibrarySample[]>(
    () =>
      aiResults.map((result) => ({
        id: `be:${result.codeId}`,
        kind: (result.prediction === "ai" ? "ai" : result.prediction === "human" ? "human" : "mixed") as SampleKind,
        fileName: result.fileName,
        title: result.fileName,
        description: `BE · ${Math.round((result.confidence ?? 0) * 100)}% · ${result.suspiciousLineCount}/${result.totalLines} dòng nghiêng`,
        author: "",
        className: "",
        uploadedAt: "",
        code: "",
      })),
    [aiResults],
  );

  const samples: LibrarySample[] = beSamples;

  useEffect(() => {
    let cancelled = false;
    const ids = aiResults.map((result) => `be:${result.codeId}`);
    const pending = ids.filter((id) => !beCodes[id]);
    if (pending.length === 0) return;
    void (async () => {
      for (const id of pending) {
        const codeId = Number(id.slice(3));
        const text = await getSnippetCode(codeId);
        if (!cancelled && text != null) setBeCodes((current) => ({ ...current, [id]: text }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aiResults, beCodes, getSnippetCode]);

  const counts = useMemo(
    () => ({
      all: samples.length,
      ai: samples.filter((s) => s.kind === "ai").length,
      human: samples.filter((s) => s.kind === "human").length,
      mixed: samples.filter((s) => s.kind === "mixed").length,
    }),
    [samples],
  );

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return samples.filter((sample) => {
      if (activeFilter !== "all" && sample.kind !== activeFilter) return false;
      if (!keyword) return true;
      return [sample.title, sample.fileName, sample.description, sample.className]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [samples, activeFilter, query]);

  const setFilter = (filter: Filter) => {
    setSearchParams(filter === "all" ? {} : { loai: filter }, { replace: true });
  };

  const heading =
    activeFilter === "ai"
      ? "Các bài nghiêng về AI"
      : activeFilter === "human"
        ? "Các bài nghiêng về người viết"
        : activeFilter === "mixed"
          ? "Các bài hỗn hợp"
          : "Toàn bộ kết quả phân tích";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200/80 pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            CODEX / Kho kết quả
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/ai-detect/cum"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50 hover:shadow-md"
            >
              Mô hình cụm
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
        <h1 className="mt-2 flex items-center gap-2.5 font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
          <FaCode className="text-stone-500" /> Kho kết quả phân tích
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Các bài đã được backend phân loại AI / người viết. Chọn một tệp để mở trang phân tích,
          nơi bạn có thể xem 34 chỉ số và nhấn từng dòng để đọc giải thích.
        </p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setFilter(filter.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    isActive ? "bg-white/15 text-white" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {counts[filter.id]}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative flex min-w-[220px] items-center">
          <FaMagnifyingGlass className="pointer-events-none absolute left-3 text-xs text-stone-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên tệp, tiêu đề…"
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-[12px] text-stone-800 shadow-sm outline-none placeholder:text-stone-500 transition focus:border-stone-400 focus:ring-2 focus:ring-amber-200"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-stone-200/80 pb-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900">{heading}</h2>
        <p className="text-xs text-stone-600">
          {visible.length} / {counts.all} tệp
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          {visible.map((sample) => (
            <SampleCard key={sample.id} sample={sample} code={sample.id.startsWith("be:") ? beCodes[sample.id] : undefined} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm">
          <FaMagnifyingGlass className="text-stone-300" size={20} />
          <p className="text-sm font-medium text-stone-700">
            {counts.all === 0 ? "Chưa có kết quả phân tích" : "Không tìm thấy tệp phù hợp"}
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-stone-600">
            {counts.all === 0
              ? "Backend chưa trả về bài nào. Hãy phân tích mã nguồn trước, kết quả sẽ xuất hiện tại đây."
              : "Thử từ khóa khác hoặc chuyển sang nhóm khác."}
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-stone-500">
        Kho kết quả chỉ hiển thị dữ liệu backend trả về cho tài khoản của bạn — không có bài mẫu
        hay dữ liệu giả được chèn vào.
      </p>
    </div>
  );
}
