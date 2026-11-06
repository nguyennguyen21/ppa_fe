import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCircleNodes,
  FaDiagramProject,
  FaMagnifyingGlassChart,
  FaShareNodes,
} from "react-icons/fa6";
import { sampleLibrary } from "../data/aiSampleLibrary";
import type { SampleKind } from "../data/aiSamples";
import {
  buildClusterModel,
  convexHullFor,
  kindColor,
} from "../modules/plagiarism/utils/cluster";
import type {
  ClusterSample,
} from "../modules/plagiarism/utils/cluster";
import { analyzeCode } from "../modules/plagiarism/utils/aiClassify";

const clusterColors = ["#d97706", "#0284c7", "#7c3aed", "#0d9488"];
const kindLabels: Record<SampleKind, string> = {
  ai: "AI tạo",
  human: "Người viết",
  mixed: "Hỗn hợp",
};
const kindChipClass: Record<SampleKind, string> = {
  ai: "bg-amber-50 text-amber-800 ring-amber-200",
  human: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  mixed: "bg-stone-100 text-stone-700 ring-stone-200",
};

const verdictLabel = (analysis: ReturnType<typeof analyzeCode>) => {
  if (analysis.verdict === "ai") return `${Math.round(analysis.aiProbability * 100)}% AI`;
  if (analysis.verdict === "human") return `${Math.round(analysis.humanProbability * 100)}% người viết`;
  return `${Math.round(analysis.aiProbability * 100)}% AI · chưa rõ`;
};

const verdictClass = (analysis: ReturnType<typeof analyzeCode>) => {
  if (analysis.verdict === "ai") return "text-amber-700";
  if (analysis.verdict === "human") return "text-emerald-700";
  return "text-stone-600";
};

export default function AiClusterPage() {
  const [k, setK] = useState(3);
  const [colorMode, setColorMode] = useState<"cluster" | "label">("cluster");
  const [showHulls, setShowHulls] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const model = useMemo(() => buildClusterModel(k), [k]);

  const selectedPoint = useMemo(
    () => model.points.find((point) => point.sample.id === selectedId) ?? null,
    [model.points, selectedId],
  );

  const selectedAnalysis = useMemo(
    () => (selectedPoint ? analyzeCode(selectedPoint.sample.code) : null),
    [selectedPoint],
  );

  const W = 820;
  const H = 500;
  const P = 46;
  const mapX = (value: number) => P + value * (W - 2 * P);
  const mapY = (value: number) => H - P - value * (H - 2 * P);

  const scatterHulls = model.groups.map((group) => {
    const pts = group.members.map((point) => ({ x: mapX(point.x), y: mapY(point.y) }));
    return { group, pts, hull: convexHullFor(pts) };
  });

  const graphW = 900;
  const graphH = 360;
  const graphP = 42;
  const gMapX = (value: number) => graphP + value * (graphW - 2 * graphP);
  const gMapY = (value: number) => graphH - graphP - value * (graphH - 2 * graphP);

  const pointColor = (point: ClusterSample) =>
    colorMode === "cluster" ? clusterColors[point.cluster] : kindColor(point.sample.kind as SampleKind);

  const toggleCluster = (id: number) => {
    setActiveCluster((current) => (current === id ? null : id));
  };

  const selectPoint = (point: ClusterSample) => {
    setSelectedId(point.sample.id);
    setActiveCluster(point.cluster);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-stone-200 pb-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-200/40 via-sky-200/30 to-violet-200/40 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            CODEX / Mô hình cụm
          </p>
          <Link
            to="/ai-detect"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 transition-colors hover:text-stone-900"
          >
            <FaArrowLeft className="text-[10px]" /> Về trang phân loại
          </Link>
        </div>
        <h1 className="relative mt-2 flex items-center gap-3 font-serif text-4xl font-semibold tracking-tight text-stone-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-sky-500 to-violet-500 text-white shadow-lg shadow-amber-500/20">
            <FaCircleNodes size={22} />
          </span>
          Bản đồ cụm AI và người viết
        </h1>
        <p className="relative mt-3 max-w-3xl text-sm leading-relaxed text-stone-500">
          12 bài mẫu được biểu diễn bằng 10 chỉ số tĩnh, sau đó được chuẩn hoá và chiếu xuống
          mặt phẳng bằng PCA. k-means ghép các bài gần nhau thành các cụm; mạng láng giềng gần
          nhất cho thấy bài nào kéo bài nào đi theo.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden border border-stone-200 bg-white px-4 py-4 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-100/60 blur-2xl" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Mẫu được phân tích
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-stone-900">
            {sampleLibrary.length}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">4 AI · 4 người viết · 4 hỗn hợp</p>
        </div>
        <div className="relative overflow-hidden border border-stone-200 bg-white px-4 py-4 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-100/60 blur-2xl" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Số cụm
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-stone-900">{model.k}</p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            k-means trên 10 chỉ số · silhouette {model.silhouette.toFixed(2)}
          </p>
        </div>
        <div className="relative overflow-hidden border border-stone-200 bg-white px-4 py-4 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-100/60 blur-2xl" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Phương sai giải thích
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-stone-900">
            {Math.round((model.explained[0] + model.explained[1]) * 100)}%
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            PC1 {Math.round(model.explained[0] * 100)}% · PC2 {Math.round(model.explained[1] * 100)}%
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-stone-200 bg-white px-5 py-3.5 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Số cụm
          </span>
          {[2, 3, 4].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setK(value);
                setActiveCluster(null);
              }}
              className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                k === value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              {value} cụm
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Tô màu
          </span>
          <button
            type="button"
            onClick={() => setColorMode("cluster")}
            className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors ${
              colorMode === "cluster"
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
            }`}
          >
            Theo cụm
          </button>
          <button
            type="button"
            onClick={() => setColorMode("label")}
            className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors ${
              colorMode === "label"
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
            }`}
          >
            Theo nhãn thực
          </button>
          <label className="ml-2 inline-flex items-center gap-1.5 text-[11.5px] text-stone-600">
            <input
              type="checkbox"
              checked={showHulls}
              onChange={(event) => setShowHulls(event.target.checked)}
              className="h-3.5 w-3.5"
            />
            Vùng cụm
          </label>
        </div>
      </div>

      {/* Scatter + cluster panel */}
      <div className="grid gap-5 min-[1150px]:grid-cols-[minmax(0,1.4fr)_340px]">
        <section className="overflow-hidden border border-stone-200 bg-white p-5 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif text-lg font-semibold text-stone-900">
                Không gian đặc trưng (PCA)
              </h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Mỗi điểm là một bài mẫu; khoảng cách phản ánh độ giống nhau của 10 chỉ số.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-stone-500">
              {colorMode === "cluster"
                ? model.groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleCluster(group.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors ${
                        activeCluster === group.id
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.label}
                    </button>
                  ))
                : (Object.keys(kindLabels) as SampleKind[]).map((kind) => (
                    <span key={kind} className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: kindColor(kind) }}
                      />
                      {kindLabels[kind]}
                    </span>
                  ))}
            </div>
          </div>

          <div className="mt-3 overflow-hidden">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full"
              role="img"
              aria-label="Biểu đồ phân tán các bài mẫu theo hai trục PCA"
            >
              <defs>
                <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
                  <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e7e5e4" strokeWidth="1" />
                </pattern>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="scatterBg" cx="50%" cy="45%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f5f5f4" />
                </radialGradient>
              </defs>
              <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="url(#scatterBg)" />

              {[0.25, 0.5, 0.75].map((tick) => (
                <g key={tick}>
                  <line
                    x1={mapX(tick)}
                    y1={P}
                    x2={mapX(tick)}
                    y2={H - P}
                    stroke="#d6d3d1"
                    strokeDasharray="3 4"
                  />
                  <line
                    x1={P}
                    y1={mapY(tick)}
                    x2={W - P}
                    y2={mapY(tick)}
                    stroke="#d6d3d1"
                    strokeDasharray="3 4"
                  />
                </g>
              ))}

              <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#78716c" strokeWidth="1.5" />
              <line x1={P} y1={P} x2={P} y2={H - P} stroke="#78716c" strokeWidth="1.5" />

              <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-stone-500 text-[11px]">
                PC1 · {Math.round(model.explained[0] * 100)}% phương sai
              </text>
              <text
                x={12}
                y={H / 2}
                textAnchor="middle"
                transform={`rotate(-90 12 ${H / 2})`}
                className="fill-stone-500 text-[11px]"
              >
                PC2 · {Math.round(model.explained[1] * 100)}% phương sai
              </text>

              {showHulls &&
                scatterHulls.map(({ group, hull }) => {
                  if (hull.length < 3) return null;
                  const dim = activeCluster !== null && group.id !== activeCluster;
                  const d = hull.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ") + " Z";
                  return (
                    <path
                      key={`hull-${group.id}`}
                      d={d}
                      fill={group.color}
                      fillOpacity={dim ? 0.02 : 0.07}
                      stroke={group.color}
                      strokeOpacity={dim ? 0.18 : 0.55}
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />
                  );
                })}

              {model.groups.map((group) => {
                const dim = activeCluster !== null && group.id !== activeCluster;
                return (
                  <g key={`centroid-${group.id}`} opacity={dim ? 0.25 : 1}>
                    <circle
                      cx={mapX(group.centroid.x)}
                      cy={mapY(group.centroid.y)}
                      r="12"
                      fill={group.color}
                      fillOpacity="0.18"
                      stroke={group.color}
                      strokeWidth="1.5"
                    />
                    <text
                      x={mapX(group.centroid.x)}
                      y={mapY(group.centroid.y) + 3.5}
                      textAnchor="middle"
                      className="fill-stone-900 text-[10px] font-bold"
                    >
                      C{group.id + 1}
                    </text>
                  </g>
                );
              })}

              {model.points.map((point) => {
                const isSelected = selectedId === point.sample.id;
                const isHovered = hoveredId === point.sample.id;
                const isDim = activeCluster !== null && point.cluster !== activeCluster;
                const fill = pointColor(point);
                const cx = mapX(point.x);
                const cy = mapY(point.y);
                return (
                  <g
                    key={point.sample.id}
                    opacity={isDim ? 0.18 : 1}
                    className="cursor-pointer"
                    onClick={() => selectPoint(point)}
                    onMouseEnter={() => setHoveredId(point.sample.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {(isHovered || isSelected) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 16 : 13}
                        fill={fill}
                        fillOpacity="0.18"
                        stroke={fill}
                        strokeWidth="1"
                        strokeOpacity="0.6"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 9 : isHovered ? 7.5 : 6.5}
                      fill={fill}
                      stroke={isSelected ? "#1c1917" : "white"}
                      strokeWidth={isSelected ? 2.2 : 1.6}
                      filter="url(#glow)"
                    />
                    {(isHovered || isSelected) && (
                      <text
                        x={cx}
                        y={cy - 16}
                        textAnchor="middle"
                        className="fill-stone-900 text-[10.5px] font-semibold"
                        style={{ pointerEvents: "none" }}
                      >
                        {point.sample.fileName}
                      </text>
                    )}
                    {isSelected && (
                      <text
                        x={cx + 12}
                        y={cy - 10}
                        className="fill-stone-900 text-[10.5px] font-semibold"
                      >
                        {point.sample.fileName}
                      </text>
                    )}
                    <title>
                      {point.sample.fileName} · {point.sample.title} ·{" "}
                      {verdictLabel(point.analysis)}
                    </title>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="overflow-hidden border border-stone-200 bg-white p-5 shadow-sm" style={{ borderRadius: 14 }}>
            <h2 className="font-serif text-base font-semibold text-stone-900">Cấu trúc cụm</h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Bấm một cụm để làm nổi bật thành viên của nó.
            </p>
            <div className="mt-3 space-y-3">
              {model.groups.map((group) => {
                const isActive = activeCluster === group.id;
                return (
                  <div
                    key={group.id}
                    className={`border px-3 py-3 shadow-sm transition-all ${
                      isActive ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                    style={{ borderRadius: 10 }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCluster(group.id)}
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-[13px] font-semibold text-stone-900">
                          {group.label}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {group.members.length} bài
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${kindChipClass[group.dominantKind as SampleKind]}`}
                      >
                        {group.members.filter((m) => m.sample.kind === group.dominantKind).length}/
                        {group.members.length} {kindLabels[group.dominantKind as SampleKind]}
                      </span>
                    </button>
                    <p className="mt-1 text-[10.5px] text-stone-500">
                      AI TB {Math.round(group.meanAi * 100)}% · chú thích TB{" "}
                      {Math.round(group.meanCommentRatio * 100)}%
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.members.map((member) => (
                        <button
                          key={member.sample.id}
                          type="button"
                          onClick={() => selectPoint(member)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] transition-colors ${
                            selectedId === member.sample.id
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                          }`}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: kindColor(member.sample.kind) }}
                          />
                          {member.sample.fileName}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden border border-stone-200 bg-white p-5 shadow-sm" style={{ borderRadius: 14 }}>
            <h2 className="font-serif text-base font-semibold text-stone-900">
              {selectedPoint ? "Bài đang chọn" : "Chọn một điểm"}
            </h2>
            {selectedPoint && selectedAnalysis ? (
              <div className="mt-2 space-y-2.5">
                <div>
                  <p className="font-serif text-[15px] font-semibold text-stone-900">
                    {selectedPoint.sample.title}
                  </p>
                  <p className="font-mono text-[10.5px] text-stone-400">
                    {selectedPoint.sample.fileName} · {selectedPoint.sample.className}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${kindChipClass[selectedPoint.sample.kind as SampleKind]}`}
                  >
                    {kindLabels[selectedPoint.sample.kind as SampleKind]}
                  </span>
                  <span className={`text-[11px] font-semibold ${verdictClass(selectedAnalysis)}`}>
                    {verdictLabel(selectedAnalysis)}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <dt className="text-stone-400">Cụm</dt>
                  <dd className="font-semibold text-stone-800">C{selectedPoint.cluster + 1}</dd>
                  <dt className="text-stone-400">Chú thích</dt>
                  <dd className="font-semibold text-stone-800">
                    {Math.round(selectedAnalysis.metrics.commentRatio * 100)}%
                  </dd>
                  <dt className="text-stone-400">Tên biến TB</dt>
                  <dd className="font-semibold text-stone-800">
                    {selectedAnalysis.metrics.variableNameLength.toFixed(1)}
                  </dd>
                  <dt className="text-stone-400">Khoảng cách</dt>
                  <dd className="font-semibold text-stone-800">
                    {selectedPoint.distanceToCentroid.toFixed(2)}
                  </dd>
                </dl>
                <Link
                  to={`/ai-detect/analyze?mau=${selectedPoint.sample.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800"
                >
                  <FaMagnifyingGlassChart /> Mở phân tích
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-[11.5px] leading-relaxed text-stone-500">
                Nhấn một điểm trên biểu đồ hoặc một bài trong danh sách cụm để xem chi tiết và mở
                trang phân tích.
              </p>
            )}
          </section>
        </aside>
      </div>

      {/* Graph network */}
      <section className="overflow-hidden border border-stone-200 bg-white p-5 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-stone-900">
              <FaShareNodes className="text-stone-400" /> Mạng tương đồng
            </h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Mỗi cạnh nối hai bài gần nhau nhất trong không gian đặc trưng; độ đậm thể hiện mức
              tương đồng.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-stone-500">
            {model.groups.map((group) => (
              <span key={group.id} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                C{group.id + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-hidden">
          <svg
            viewBox={`0 0 ${graphW} ${graphH}`}
            className="h-auto w-full"
            role="img"
            aria-label="Đồ thị mạng tương đồng các bài mẫu"
          >
            <rect x="0" y="0" width={graphW} height={graphH} fill="#fbfbfa" />

            {model.edges.map((edge) => {
              const a = model.points.find((point) => point.sample.id === edge.a);
              const b = model.points.find((point) => point.sample.id === edge.b);
              if (!a || !b) return null;
              const isDim =
                activeCluster !== null && (a.cluster !== activeCluster || b.cluster !== activeCluster);
              return (
                <line
                  key={`${edge.a}-${edge.b}`}
                  x1={gMapX(a.x)}
                  y1={gMapY(a.y)}
                  x2={gMapX(b.x)}
                  y2={gMapY(b.y)}
                  stroke="#a8a29e"
                  strokeWidth={1 + edge.weight * 2.2}
                  strokeOpacity={isDim ? 0.12 : 0.45}
                  strokeLinecap="round"
                />
              );
            })}

            {model.points.map((point) => {
              const isSelected = selectedId === point.sample.id;
              const isDim = activeCluster !== null && point.cluster !== activeCluster;
              const fill = pointColor(point);
              const cx = gMapX(point.x);
              const cy = gMapY(point.y);
              return (
                <g
                  key={`graph-${point.sample.id}`}
                  opacity={isDim ? 0.25 : 1}
                  className="cursor-pointer"
                  onClick={() => selectPoint(point)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 13 : 10}
                    fill={fill}
                    stroke={isSelected ? "#1c1917" : "white"}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    className="fill-stone-600 text-[9px]"
                  >
                    {point.sample.fileName.replace(/\.[^.]+$/, "")}
                  </text>
                  <title>
                    {point.sample.fileName} · {point.sample.title} ·{" "}
                    {verdictLabel(point.analysis)}
                  </title>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Explainability */}
      <section className="border border-stone-200 bg-white p-5" style={{ borderRadius: 10 }}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-stone-900">
              <FaDiagramProject className="text-stone-400" /> Vì sao AI và người viết tách nhau?
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
              PCA nén 10 chỉ số thành hai trục. Các thanh dưới đây cho biết chỉ số nào đóng góp
              mạnh nhất vào từng trục, giúp giải thích cụm mà không cần đọc toàn bộ hồ sơ chỉ số.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {[
            { title: "Trục ngang (PC1)", data: model.loadings.pc1, color: "#d97706" },
            { title: "Trục dọc (PC2)", data: model.loadings.pc2, color: "#0284c7" },
          ].map((axis) => {
            const top = axis.data.slice(0, 5);
            const max = Math.max(...top.map((item) => Math.abs(item.value)), 0.001);
            return (
              <div key={axis.title}>
                <p className="text-[12px] font-semibold text-stone-800">{axis.title}</p>
                <div className="mt-2 space-y-2">
                  {top.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 truncate text-[11px] text-stone-600">
                        {item.label}
                      </span>
                      <div className="relative h-2 flex-1 bg-stone-100">
                        <span className="absolute left-1/2 top-0 h-full w-px bg-stone-300" />
                        <span
                          className={`absolute top-0 h-full ${
                            item.value >= 0 ? "left-1/2" : "right-1/2"
                          }`}
                          style={{
                            width: `${(Math.abs(item.value) / max) * 46}%`,
                            backgroundColor: axis.color,
                          }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-mono text-[10.5px] text-stone-500">
                        {item.value >= 0 ? "+" : ""}
                        {item.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
          PC1 chủ yếu phản ánh {model.loadings.pc1[0].label.toLowerCase()} và{" "}
          {model.loadings.pc1[1].label.toLowerCase()}; PC2 phản ánh{" "}
          {model.loadings.pc2[0].label.toLowerCase()} và{" "}
          {model.loadings.pc2[1].label.toLowerCase()}. Các bài AI thường nằm ở phía có mật độ chú
          thích cao và tên biến dài, còn bài người viết nằm ở phía ngược lại; bài hỗn hợp thường
          ở giữa hai vùng đó.
        </p>
      </section>

      <p className="text-[11px] leading-relaxed text-stone-400">
        Phân cụm là mô hình heuristic trên 10 chỉ số đã chuẩn hoá, dùng để trực quan hoá xu
        hướng chứ không phải kết luận chắc chắn. Silhouette đo mức tách cụm trong không gian đặc
        trưng; giá trị càng gần 1 càng tách rõ.
      </p>
    </div>
  );
}
