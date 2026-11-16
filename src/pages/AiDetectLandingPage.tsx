import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaFileArrowUp,
  FaRobot,
  FaUser,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import type { SampleKind } from "../data/aiSampleTypes";
import { useBackendData } from "../shared/hook/backend-data-context";

interface LandingCardData {
  id: string;
  info: {
    fileName: string;
    title: string;
    description: string;
    accent: "amber" | "emerald" | "stone";
  };
  entries: number;
  averageAi: number;
  preview: string[];
  fileName: string;
}

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
  const { aiResults } = useBackendData();

  const cards = useMemo<LandingCardData[]>(() => {
    const infoByKind: Record<SampleKind, { title: string; description: string; accent: "amber" | "emerald" | "stone" }> = {
      ai: {
        title: "Code do AI sinh",
        description: "Docstring đầy đủ, type hints, tên biến dài và thụt lề đều — những dấu hiệu thường gặp ở code do AI tạo.",
        accent: "amber",
      },
      human: {
        title: "Code người viết",
        description: "Hàm ngắn, biến i/n/a, ít chú thích và viết liền — những dấu hiệu thường gặp ở code viết tay.",
        accent: "emerald",
      },
      mixed: {
        title: "Mã hỗn hợp",
        description: "Nửa đầu có cấu trúc, nửa sau viết tay nhanh — những bài có dấu hiệu lẫn giữa AI và người viết.",
        accent: "stone",
      },
    };
    return (["ai", "human", "mixed"] as SampleKind[]).map((kind) => {
      const items = aiResults.filter((r) => r.prediction === kind);
      const averageAi =
        items.length > 0
          ? items.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / items.length
          : 0;
      const first = items[0];
      const info = infoByKind[kind];
      return {
        id: kind,
        info: {
          ...info,
          fileName: first?.fileName ?? "Chưa có tệp",
        },
        entries: items.length,
        averageAi,
        preview: [],
        fileName: first?.fileName ?? "Chưa có tệp",
      };
    });
  }, [aiResults]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            CODEX / Phân loại
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Chọn mã nguồn để phân tích
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Ba nhóm kết quả phân loại được tổng hợp từ dữ liệu backend. Chọn một nhóm để xem
            danh sách tệp, rồi mở trang phân tích để xem 34 chỉ số và nhấn vào từng dòng để đọc
            giải thích.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/ai-detect/kho-mau"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50 hover:shadow-md"
          >
            Kho kết quả · {aiResults.length} tệp
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/ai-detect/cum"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50 hover:shadow-md"
          >
            Mô hình cụm
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* 3 options */}
      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map((card) => {
          const accent = accents[card.info.accent];
          const Icon = icons[card.id as SampleKind];
          return (
            <Link
              key={card.id}
              to={`/ai-detect/kho-mau?loai=${card.id}`}
              className={`group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${accent.border}`}
            >
              <span className={`h-1.5 w-full ${accent.bar}`} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${accent.icon}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        {accent.label}
                      </p>
                      <p className="font-mono text-xs text-stone-600">
                        {card.entries} tệp · {card.fileName}
                      </p>
                    </div>
                  </div>
                  {card.entries > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${accent.chip}`}
                    >
                      {verdictLabel(card.averageAi)}
                    </span>
                  )}
                </div>

                <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-stone-900">
                  {card.info.title}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-stone-600">
                  {card.info.description}
                </p>

                <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                  <div className="flex items-center gap-1.5 border-b border-stone-200 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    <span className="ml-1.5 truncate font-mono text-xs text-stone-500">
                      {card.fileName}
                    </span>
                  </div>
                  <pre className="h-[144px] overflow-hidden px-3 py-2 font-mono text-xs leading-[1.7]">
                    {card.preview.length === 0 ? (
                      <span className="text-stone-500">Chưa có dữ liệu từ backend.</span>
                    ) : (
                      card.preview.map((line, index) => (
                        <div
                          key={index}
                          className={
                            isPreviewComment(line)
                              ? "text-stone-500"
                              : line.trim() === ""
                                ? "text-transparent"
                                : "text-stone-700"
                          }
                        >
                          {line || " "}
                        </div>
                      ))
                    )}
                  </pre>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-xs text-stone-600">
                  <span className="text-stone-500">
                    {card.entries > 0 ? "Dữ liệu backend" : "Chưa có dữ liệu"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-stone-900">
                    {card.entries > 0 ? `Xem ${card.entries} tệp` : "Chưa có kết quả"}
                    <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Custom code */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <p className="font-serif text-lg font-semibold text-stone-900">
            Không có mẫu bạn cần?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            Mở trang phân tích rồi nạp một tệp từ máy hoặc dán mã của bạn vào khung soạn thảo.
          </p>
        </div>
        <Link
          to="/ai-detect/analyze?mau=custom"
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md"
        >
          <FaFileArrowUp /> Phân tích mã của tôi
        </Link>
      </div>

      <p className="text-xs leading-relaxed text-stone-500">
        Mẹo: trong trang phân tích, nhấn vào một dòng mã để xem dòng đó nghiêng về AI hay
        người viết, kèm lý do cụ thể. Chấm vàng ở lề là tín hiệu AI, chấm xanh là tín hiệu
        người viết.
      </p>
    </div>
  );
}
