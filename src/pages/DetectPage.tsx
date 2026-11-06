import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaCheck,
  FaCircleInfo,
  FaCode,
  FaFileArrowUp,
  FaPen,
  FaRobot,
  FaSliders,
  FaUser,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";
import { samples, type SampleKind } from "../data/aiSamples";
import { findLibrarySample, samplesOfKind, type LibrarySample } from "../data/aiSampleLibrary";
import {
  analyzeCode,
  analyzeLine,
  formatMetric,
  languageLabel,
  METRIC_GROUPS,
  type AnalysisResult,
  type Verdict,
} from "../modules/plagiarism/utils/aiClassify";

const verdictStyle: Record<
  Verdict,
  { label: string; caption: string; icon: typeof FaRobot; text: string; bg: string; ring: string }
> = {
  ai: {
    label: "AI tạo",
    caption: "Dấu hiệu tổng hợp nghiêng về máy",
    icon: FaRobot,
    text: "text-amber-800",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  human: {
    label: "Người viết",
    caption: "Dấu hiệu tổng hợp nghiêng về người",
    icon: FaUser,
    text: "text-emerald-800",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  unclear: {
    label: "Chưa đủ căn cứ",
    caption: "Hai nhóm dấu hiệu đang cân bằng",
    icon: FaWandMagicSparkles,
    text: "text-stone-700",
    bg: "bg-stone-100",
    ring: "ring-stone-200",
  },
};

const bigProbability = (analysis: AnalysisResult) =>
  Math.round(
    (analysis.verdict === "human"
      ? analysis.humanProbability
      : analysis.verdict === "ai"
        ? analysis.aiProbability
        : 0.5) * 100,
  );

const toneMeta = {
  ai: {
    label: "Nghiêng AI",
    dot: "bg-amber-500",
    row: "bg-amber-50/50 hover:bg-amber-50",
    selected: "bg-amber-100",
    chip: "bg-amber-50 text-amber-800 ring-amber-200",
    text: "text-amber-800",
    code: "border-amber-200 bg-amber-50/40",
  },
  human: {
    label: "Nghiêng người viết",
    dot: "bg-emerald-500",
    row: "bg-emerald-50/40 hover:bg-emerald-50",
    selected: "bg-emerald-100",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    text: "text-emerald-800",
    code: "border-emerald-200 bg-emerald-50/40",
  },
  neutral: {
    label: "Trung tính",
    dot: "bg-stone-300",
    row: "hover:bg-stone-100/80",
    selected: "bg-stone-200",
    chip: "bg-stone-100 text-stone-700 ring-stone-200",
    text: "text-stone-700",
    code: "border-stone-200 bg-[#fbfbfa]",
  },
} as const;

const kindFromParam = (value: string | null): SampleKind | "custom" => {
  if (value === "ai" || value === "human" || value === "mixed") return value;
  return "custom";
};

const resolveSampleParam = (value: string | null): LibrarySample | null => {
  if (!value) return null;
  const direct = findLibrarySample(value);
  if (direct) return direct;
  if (value === "ai" || value === "human" || value === "mixed") {
    return samplesOfKind(value)[0] ?? null;
  }
  return null;
};

export default function DetectPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mauParam = searchParams.get("mau");
  const initialKind = kindFromParam(mauParam);
  const initialEntry = resolveSampleParam(mauParam);

  const [code, setCode] = useState(initialEntry?.code ?? "");
  const [sample, setSample] = useState<SampleKind | "custom">(
    initialEntry?.kind ?? initialKind,
  );
  const [sampleId, setSampleId] = useState<string | null>(initialEntry?.id ?? null);
  const [editing, setEditing] = useState(!initialEntry);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const analysis = useMemo(() => analyzeCode(code), [code]);
  const style = verdictStyle[analysis.verdict];
  const VerdictIcon = style.icon;
  const maxWeight = Math.max(0.1, ...analysis.signals.map((s) => Math.abs(s.weight)));

  const lines = useMemo(() => {
    if (code.trim() === "") return [];
    return code.replace(/\r\n?/g, "\n").split("\n");
  }, [code]);

  const insights = useMemo(
    () => lines.map((line, index) => analyzeLine(line, analysis.language, index + 1)),
    [lines, analysis.language],
  );

  const aiLineCount = insights.filter((item) => item.tone === "ai").length;
  const humanLineCount = insights.filter((item) => item.tone === "human").length;
  const activeSample = sampleId ? findLibrarySample(sampleId) : null;
  const currentInsight =
    selectedLine !== null ? insights[selectedLine - 1] ?? null : null;

  // Đổi mẫu trên URL (ví dụ mở từ kho mẫu) thì nạp lại nội dung tương ứng.
  useEffect(() => {
    const entry = resolveSampleParam(mauParam);
    if (!entry) return;
    setCode(entry.code);
    setSample(entry.kind);
    setSampleId(entry.id);
    setEditing(false);
    setSelectedLine(null);
  }, [mauParam]);

  const loadSample = (kind: SampleKind) => {
    const entry = samplesOfKind(kind)[0];
    if (!entry) return;
    setSample(kind);
    setSampleId(entry.id);
    setCode(entry.code);
    setSelectedLine(null);
    setEditing(false);
    setSearchParams({ mau: entry.id }, { replace: true });
  };

  const loadFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setCode(text);
    setSample("custom");
    setSampleId(null);
    setSelectedLine(null);
    setEditing(false);
    setSearchParams({ mau: "custom" }, { replace: true });
  };

  const syncScroll = () => {
    if (gutterRef.current && editorRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const selectLine = (line: number) => {
    const isFirstSelection = selectedLine === null;
    setSelectedLine(line);
    if (isFirstSelection) {
      window.setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    }
  };

  const codeHeader = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <FaCode className="text-stone-400" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Mã nguồn
        </span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10.5px] font-semibold text-stone-600">
          {languageLabel[analysis.language]}
        </span>
        {activeSample && (
          <span className="font-mono text-[10.5px] text-stone-400">{activeSample.fileName}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {samples.map((s) => (
          <button
            key={s.id}
            type="button"
            title={s.hint}
            onClick={() => loadSample(s.id)}
            className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
              sample === s.id
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        >
          <FaFileArrowUp /> Nạp file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".c,.h,.cpp,.cc,.cxx,.hpp,.py,.java,.js,.jsx,.ts,.tsx,.cs,.go,.rs,.txt"
          className="hidden"
          onChange={(event) => {
            void loadFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            CODEX / Phân loại
          </p>
        <div className="flex items-center gap-2">
          <Link
            to="/ai-detect/cum"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 transition-colors hover:text-stone-900"
          >
            Mô hình cụm
          </Link>
          <Link
            to={sample === "custom" ? "/ai-detect/kho-mau" : `/ai-detect/kho-mau?loai=${sample}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 transition-colors hover:text-stone-900"
          >
            <FaArrowLeft className="text-[10px]" /> Kho mẫu
          </Link>
        </div>
        </div>
        <h1 className="mt-2 flex items-center gap-2.5 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          <FaRobot className="text-stone-400" /> Phân biệt code AI và người viết
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Trích xuất 34 chỉ số tĩnh rồi so sánh với xu hướng code do AI sinh và code viết tay.
          Nhấn vào một dòng trong khung mã để xem dòng đó nghiêng về phía nào và vì sao.
        </p>
      </div>

      {/* Code + verdict */}
      <div className="grid gap-5 min-[1150px]:grid-cols-[minmax(0,1fr)_360px]">
        <section
          className="flex min-w-0 flex-col border border-stone-200 bg-white"
          style={{ borderRadius: 10 }}
        >
          {codeHeader}

          {editing ? (
            <div className="flex h-[460px] min-h-0 overflow-hidden bg-[#fbfbfa]">
              <div
                ref={gutterRef}
                className="w-12 shrink-0 select-none overflow-hidden border-r border-stone-200 bg-stone-50 py-3 text-right font-mono text-[11px] leading-[21px] text-stone-400"
                aria-hidden="true"
              >
                {Array.from({ length: Math.max(1, lines.length) }, (_, i) => i + 1).map((n) => (
                  <div key={n} className="pr-2">
                    {n}
                  </div>
                ))}
              </div>
              <textarea
                ref={editorRef}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setSample("custom");
                  setSampleId(null);
                  setSelectedLine(null);
                }}
                onScroll={syncScroll}
                spellCheck={false}
                wrap="off"
                autoFocus
                aria-label="Mã nguồn cần phân loại"
                placeholder="Dán code vào đây, hoặc nạp một tệp từ máy…"
                className="h-full min-w-0 flex-1 resize-none overflow-auto bg-transparent px-3 py-3 font-mono text-[12.5px] leading-[21px] text-stone-800 outline-none placeholder:text-stone-400"
              />
            </div>
          ) : lines.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-2">
                <p className="inline-flex items-center gap-1.5 text-[10.5px] text-stone-500">
                  <FaCircleInfo className="text-stone-400" />
                  Nhấn vào một dòng để xem giải thích
                </p>
                <div className="flex items-center gap-3 text-[10.5px] font-medium text-stone-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${toneMeta.ai.dot}`} /> AI
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${toneMeta.human.dot}`} /> Người
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${toneMeta.neutral.dot}`} /> Trung tính
                  </span>
                </div>
              </div>
              <div className="max-h-[460px] min-h-0 overflow-auto bg-[#fbfbfa] py-1">
                {insights.map((insight, index) => {
                  const tone = toneMeta[insight.tone];
                  const isSelected = selectedLine === insight.line;
                  return (
                    <button
                      key={insight.line}
                      type="button"
                      onClick={() => selectLine(insight.line)}
                      aria-pressed={isSelected}
                      title={insight.summary}
                      className={`flex w-max min-w-full items-stretch text-left font-mono text-[12.5px] leading-[21px] transition-colors ${
                        isSelected ? tone.selected : tone.row
                      }`}
                    >
                      <span
                        className={`sticky left-0 z-10 flex w-[74px] shrink-0 select-none items-center justify-end gap-2 border-r border-stone-200 px-2 py-[1px] text-[11px] text-stone-400 ${
                          isSelected ? "bg-stone-200" : "bg-stone-50/95"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot} ${
                            insight.tone === "neutral" ? "opacity-40" : ""
                          }`}
                        />
                        {insight.line}
                      </span>
                      <span
                        className={`whitespace-pre px-3 py-[1px] ${
                          insight.tone === "neutral" ? "text-stone-800" : "text-stone-900"
                        }`}
                      >
                        {lines[index] || " "}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2 px-6 text-center">
              <FaCircleInfo className="text-stone-300" size={22} />
              <p className="font-serif text-lg font-semibold text-stone-900">Chưa có mã nguồn</p>
              <p className="max-w-sm text-xs leading-relaxed text-stone-500">
                Nạp một tệp từ máy hoặc dùng một trong các mẫu của hệ thống để bắt đầu phân tích.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => loadSample("ai")}
                  className="rounded-md bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800"
                >
                  Dùng mẫu AI
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Nạp file
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3">
            <p className="text-[11.5px] text-stone-500">
              <span className="font-semibold text-stone-700">{analysis.codeLineCount}</span> dòng mã
              <span className="mx-1.5 text-stone-300">·</span>
              <span className="font-semibold text-stone-700">{analysis.functionCount}</span> hàm
              <span className="mx-1.5 text-stone-300">·</span>
              <span className="font-semibold text-stone-700">{code.length.toLocaleString("vi-VN")}</span>{" "}
              ký tự
              {insights.length > 0 && (
                <>
                  <span className="mx-1.5 text-stone-300">·</span>
                  <span className="font-semibold text-amber-700">{aiLineCount}</span> dòng nghiêng AI
                  <span className="mx-1.5 text-stone-300">·</span>
                  <span className="font-semibold text-emerald-700">{humanLineCount}</span> dòng nghiêng
                  người
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold ${
                  editing
                    ? "border-stone-900 bg-stone-900 text-white hover:bg-stone-800"
                    : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {editing ? <FaCheck /> : <FaPen />}
                {editing ? "Xong" : "Sửa mã"}
              </button>
              {code.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCode("");
                    setSample("custom");
                    setSampleId(null);
                    setSelectedLine(null);
                    setEditing(true);
                    setSearchParams({ mau: "custom" }, { replace: true });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
                >
                  <FaXmark /> Xóa nội dung
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Verdict */}
        <aside
          className="flex min-w-0 flex-col border border-stone-200 bg-white p-5"
          style={{ borderRadius: 10 }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Kết quả phân loại
            </p>
            <span className="flex items-center gap-1.5 text-[10.5px] text-stone-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" /> trực tiếp
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${style.bg} ${style.text} ${style.ring}`}
            >
              <VerdictIcon size={20} />
            </span>
            <div className="min-w-0">
              <p className={`font-serif text-2xl font-semibold ${style.text}`}>{style.label}</p>
              <p className="text-xs text-stone-500">{style.caption}</p>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="font-serif text-5xl font-semibold tracking-tight text-stone-900">
                {bigProbability(analysis)}
                <span className="text-2xl">%</span>
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {analysis.verdict === "human" ? "khả năng do người viết" : "khả năng do AI tạo"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-stone-400">
                Độ chắc chắn
              </p>
              <p className="text-sm font-semibold text-stone-800">
                {Math.round(analysis.confidence * 100)}%
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="relative flex h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="bg-emerald-500/80"
                style={{ width: `${analysis.humanProbability * 100}%` }}
              />
              <div
                className="bg-amber-500/90"
                style={{ width: `${analysis.aiProbability * 100}%` }}
              />
              <span
                className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-stone-900"
                style={{ left: `calc(${analysis.aiProbability * 100}% - 1px)` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold">
              <span className="text-emerald-700">
                Người viết {Math.round(analysis.humanProbability * 100)}%
              </span>
              <span className="text-amber-700">AI {Math.round(analysis.aiProbability * 100)}%</span>
            </div>
          </div>

          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Tín hiệu nổi bật
            </p>
            {analysis.signals.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {analysis.signals.slice(0, 5).map((signal) => (
                  <li key={signal.key} className="flex gap-2.5">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        signal.weight > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {signal.weight > 0 ? (
                        <FaArrowTrendUp size={10} />
                      ) : (
                        <FaArrowTrendDown size={10} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium leading-snug text-stone-800">
                        {signal.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-stone-500">
                        {signal.detail}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-[11px] font-semibold ${
                        signal.weight > 0 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {signal.weight > 0 ? "+" : ""}
                      {signal.weight.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-stone-500">
                Chưa trích xuất được tín hiệu nào từ đoạn mã hiện tại.
              </p>
            )}
          </div>

          {analysis.notes.length > 0 && (
            <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] leading-relaxed text-stone-500">
              {analysis.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          )}

          <p className="mt-auto pt-5 text-[10.5px] leading-relaxed text-stone-400">
            Điểm số là ước lượng thống kê từ 34 chỉ số, không đủ để kết luận thay giảng viên.
            Nên đọc kèm tín hiệu và bối cảnh bài làm.
          </p>
        </aside>
      </div>

      {/* Line explanation */}
      <section
        ref={panelRef}
        className="scroll-mt-20 border border-stone-200 bg-white"
        style={{ borderRadius: 10 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <FaCode className="text-stone-400" />
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              Giải thích dòng đang chọn
            </h2>
            {currentInsight && (
              <>
                <span className="font-mono text-[11px] text-stone-400">
                  Dòng {currentInsight.line}
                </span>
                <span className="text-stone-300">/</span>
                <span className="text-[11.5px] text-stone-500">{currentInsight.type}</span>
              </>
            )}
          </div>
          {currentInsight ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ring-1 ${toneMeta[currentInsight.tone].chip}`}
            >
              {toneMeta[currentInsight.tone].label}
            </span>
          ) : (
            <span className="text-[10.5px] text-stone-400">
              Chọn một dòng trong khung mã để bắt đầu
            </span>
          )}
        </div>

        {currentInsight ? (
          <div className="space-y-4 p-5">
            <pre
              className={`overflow-auto border px-3 py-2 font-mono text-[12px] leading-[20px] text-stone-800 ${toneMeta[currentInsight.tone].code}`}
            >
              {lines[currentInsight.line - 1] || " "}
            </pre>

            <p className="text-sm leading-relaxed text-stone-700">{currentInsight.summary}</p>

            {currentInsight.signals.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2">
                {currentInsight.signals.map((signal, index) => (
                  <div
                    key={`${signal.label}-${index}`}
                    className="flex items-start gap-2.5 border border-stone-100 bg-stone-50/60 px-3 py-2"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        signal.weight > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {signal.weight > 0 ? (
                        <FaArrowTrendUp size={10} />
                      ) : (
                        <FaArrowTrendDown size={10} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium leading-snug text-stone-800">
                        {signal.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-stone-500">
                        {signal.detail}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-[11px] font-semibold ${
                        signal.weight > 0 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {signal.weight > 0 ? "+" : ""}
                      {signal.weight.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-stone-500">
                Dòng này không có tín hiệu đủ mạnh để nghiêng hẳn về một phía. Những dòng như vậy
                thường là khai báo, dấu ngoặc hoặc câu lệnh trung tính.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-10 text-center">
            <FaCircleInfo className="text-stone-300" size={20} />
            <p className="text-sm font-medium text-stone-700">
              Nhấn vào một dòng trong khung mã
            </p>
            <p className="max-w-md text-xs leading-relaxed text-stone-500">
              Hệ thống sẽ giải thích dòng đó nghiêng về AI hay người viết, kèm các tín hiệu cụ thể
              như chú thích, khai báo kiểu, cách đặt tên hay định dạng.
            </p>
          </div>
        )}
      </section>

      {/* Metrics */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Hồ sơ chỉ số
            </p>
            <h2 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-stone-900">
              34 chỉ số được trích xuất
            </h2>
          </div>
          <p className="text-xs text-stone-500">Tính trực tiếp từ mã nguồn · cập nhật khi bạn sửa</p>
        </div>

        <div className="mt-4 gap-4 md:columns-2 xl:columns-3">
          {METRIC_GROUPS.map((group) => (
            <section
              key={group.id}
              className="mb-4 break-inside-avoid border border-stone-200 bg-white p-4"
              style={{ borderRadius: 10 }}
            >
              <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 pb-2.5">
                <h3 className="text-[13px] font-semibold text-stone-900">{group.title}</h3>
                <span className="text-[10.5px] uppercase tracking-wide text-stone-400">
                  {group.items.length} chỉ số
                </span>
              </div>
              <dl className="mt-1 divide-y divide-stone-100">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3 py-2">
                    <dt className="min-w-0">
                      <span className="block text-[12px] font-medium leading-snug text-stone-800">
                        {item.label}
                      </span>
                      <span
                        className="mt-0.5 line-clamp-2 block text-[10.5px] leading-relaxed text-stone-400"
                        title={item.desc}
                      >
                        {item.desc}
                      </span>
                    </dt>
                    <dd className="shrink-0 pt-0.5 font-mono text-[13px] font-semibold text-stone-900">
                      {formatMetric(analysis.metrics[item.key] ?? 0, item.format)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section className="border border-stone-200 bg-white p-5" style={{ borderRadius: 10 }}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-stone-900">
              <FaSliders className="text-stone-400" /> Cách hệ thống chấm điểm
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
              Mỗi chỉ số được quy thành một tín hiệu có trọng số. Điểm dương nghiêng về AI, điểm âm
              nghiêng về người viết; tổng điểm đi qua hàm logistic để ra xác suất.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600" /> Người viết
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> AI
            </span>
          </div>
        </div>

        {analysis.signals.length > 0 ? (
          <div className="mt-4 grid gap-x-8 gap-y-3 lg:grid-cols-2">
            {analysis.signals.map((signal) => (
              <div key={signal.key} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium leading-snug text-stone-800">
                    {signal.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{signal.detail}</p>
                </div>
                <div className="relative hidden h-2 w-28 shrink-0 bg-stone-100 sm:block">
                  <span className="absolute left-1/2 top-0 h-full w-px bg-stone-300" />
                  <span
                    className={`absolute top-0 h-full ${
                      signal.weight > 0 ? "left-1/2 bg-amber-500" : "right-1/2 bg-emerald-600"
                    }`}
                    style={{ width: `${(Math.abs(signal.weight) / maxWeight) * 50}%` }}
                  />
                </div>
                <span
                  className={`w-11 shrink-0 text-right font-mono text-[11px] font-semibold ${
                    signal.weight > 0 ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {signal.weight > 0 ? "+" : ""}
                  {signal.weight.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">Chưa có tín hiệu để hiển thị.</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-stone-100 pt-4 text-[11px] text-stone-500">
          <span>
            <span className="font-semibold text-stone-700">AI ≥ 65%</span>
          </span>
          <span>
            <span className="font-semibold text-stone-700">Người viết ≤ 35%</span>
          </span>
          <span>35–65%: chưa đủ căn cứ</span>
          <span className="ml-auto font-mono">
            Điểm thô: {analysis.rawScore > 0 ? "+" : ""}
            {analysis.rawScore.toFixed(2)}
          </span>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-stone-400">
        Mức phân loại của từng dòng dựa trên tín hiệu cục bộ của chính dòng đó (chú thích, khai báo
        kiểu, độ dài định danh, định dạng), không phải kết luận chắc chắn. Dấu chấm vàng ở lề là
        tín hiệu AI, dấu chấm xanh là tín hiệu người viết, chấm xám là trung tính.
      </p>
    </div>
  );
}
