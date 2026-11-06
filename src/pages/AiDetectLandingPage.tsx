import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaFileArrowUp,
  FaRobot,
  FaUser,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { samples, sampleInfo, type SampleKind } from "../data/aiSamples";
import { sampleLibrary, samplesOfKind } from "../data/aiSampleLibrary";
import { analyzeCode } from "../modules/plagiarism/utils/aiClassify";

const accents = {
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-200",
    bar: "bg-amber-400",
    border: "hover:border-amber-300",
    chip: "bg-amber-50 text-amber-800 ring-amber-200",
    label: "NHÓM AI",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bar: "bg-emerald-500",
    border: "hover:border-emerald-300",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    label: "NHÓM NGƯỜI VIẾT",
  },
  stone: {
    icon: "bg-stone-100 text-stone-700 ring-stone-200",
    bar: "bg-stone-400",
    border: "hover:border-stone-300",
    chip: "bg-stone-100 text-stone-700 ring-stone-200",
    label: "NHÓM HỖN HỢP",
  },
} as const;

const icons = {
  ai: FaRobot,
  human: FaUser,
  mixed: FaWandMagicSparkles,
} as const;

const verdictLabel = (averageAi: number) => {
  if (averageAi >= 0.65) {
    return `${Math.round(averageAi * 100)}% AI`;
  }
  if (averageAi <= 0.35) {
    return `${Math.round((1 - averageAi) * 100)}% người viết`;
  }
  return `${Math.round(averageAi * 100)}% AI · chưa rõ`;
};

const snippetLines = (code: string) => code.replace(/\s+$/, "").split("\n").slice(0, 8);

const isPreviewComment = (line: string) => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith('"""') ||
    trimmed.startsWith("'''")
  );
};

export default function AiDetectLandingPage() {
  const cards = useMemo(
    () =>
      samples.map((sample) => {
        const entries = samplesOfKind(sample.id);
        const analyses = entries.map((entry) => analyzeCode(entry.code));
        const averageAi =
          analyses.reduce((sum, item) => sum + item.aiProbability, 0) / analyses.length;

        return {
          ...sample,
          info: sampleInfo[sample.id],
          entries: entries.length,
          averageAi,
          analysis: analyses[0],
          preview: snippetLines(entries[0].code),
          fileName: entries[0].fileName,
        };
      }),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            CODEX / Phân loại
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Chọn mã nguồn để phân tích
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
            Ba nhóm mẫu được lấy từ kho mã nguồn của hệ thống. Chọn một nhóm để xem danh sách
            tệp, rồi mở trang phân tích để xem 34 chỉ số và nhấn vào từng dòng để đọc giải thích.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/ai-detect/kho-mau"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
          >
            Kho mẫu hệ thống · {sampleLibrary.length} tệp
            <FaArrowRight className="text-[9px]" />
          </Link>
          <Link
            to="/ai-detect/cum"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
          >
            Mô hình cụm
            <FaArrowRight className="text-[9px]" />
          </Link>
        </div>
      </div>

      {/* 3 options */}
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => {
          const accent = accents[card.info.accent];
          const Icon = icons[card.id as SampleKind];
          return (
            <Link
              key={card.id}
              to={`/ai-detect/kho-mau?loai=${card.id}`}
              className={`group flex h-full flex-col overflow-hidden border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-sm ${accent.border}`}
              style={{ borderRadius: 10 }}
            >
              <span className={`h-1 w-full ${accent.bar}`} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 ${accent.icon}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        {accent.label}
                      </p>
                      <p className="font-mono text-[11px] text-stone-500">
                        {card.entries} tệp · {card.fileName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${accent.chip}`}
                  >
                    {verdictLabel(card.averageAi)}
                  </span>
                </div>

                <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-stone-900">
                  {card.info.title}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-stone-500">
                  {card.info.description}
                </p>

                <div className="mt-4 overflow-hidden border border-stone-200 bg-[#fbfbfa]">
                  <div className="flex items-center gap-1.5 border-b border-stone-100 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    <span className="ml-1.5 truncate font-mono text-[9.5px] text-stone-400">
                      {card.fileName}
                    </span>
                  </div>
                  <pre className="h-[144px] overflow-hidden px-3 py-2 font-mono text-[10px] leading-[1.7]">
                    {card.preview.map((line, index) => (
                      <div
                        key={index}
                        className={
                          isPreviewComment(line)
                            ? "text-stone-400"
                            : line.trim() === ""
                              ? "text-transparent"
                              : "text-stone-700"
                        }
                      >
                        {line || " "}
                      </div>
                    ))}
                  </pre>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <span className="font-semibold text-stone-700">
                        {card.analysis.metrics.totalLines}
                      </span>{" "}
                      dòng
                    </span>
                    <span>
                      <span className="font-semibold text-stone-700">
                        {card.analysis.functionCount}
                      </span>{" "}
                      hàm
                    </span>
                    <span>
                      <span className="font-semibold text-stone-700">
                        {Math.round(card.analysis.metrics.commentRatio * 100)}%
                      </span>{" "}
                      chú thích
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-stone-900">
                    Xem {card.entries} tệp
                    <FaArrowRight className="text-[10px] transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Custom code */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 border border-stone-200 bg-white p-5"
        style={{ borderRadius: 10 }}
      >
        <div>
          <p className="font-serif text-lg font-semibold text-stone-900">
            Không có mẫu bạn cần?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-500">
            Mở trang phân tích rồi nạp một tệp từ máy hoặc dán mã của bạn vào khung soạn thảo.
          </p>
        </div>
        <Link
          to="/ai-detect/analyze?mau=custom"
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          <FaFileArrowUp /> Phân tích mã của tôi
        </Link>
      </div>

      <p className="text-[11px] leading-relaxed text-stone-400">
        Mẹo: trong trang phân tích, nhấn vào một dòng mã để xem dòng đó nghiêng về AI hay
        người viết, kèm lý do cụ thể. Chấm vàng ở lề là tín hiệu AI, chấm xanh là tín hiệu
        người viết.
      </p>
    </div>
  );
}
