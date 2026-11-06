import { useMemo, useRef, useState } from "react";
import {
  FaArrowRight,
  FaChartSimple,
  FaCodeCompare,
  FaMagnifyingGlass,
  FaPause,
  FaPlay,
  FaRotateRight,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import { mockSubmissions } from "../data/mock";
import { pairRelations } from "../data/pairRelations";

// ---------------------------------------------------------------------------
// Biểu đồ quan hệ kiểu DOLOS: node tròn màu theo nhãn (innocent/plagiarism),
// đường nối mảnh, cụm nhỏ dày đặc, nền trắng tối giản.
// ---------------------------------------------------------------------------

type Tone = "innocent" | "plagiarism";

interface Node {
  id: string;
  fileName: string;
  studentCode: string;
  studentName: string;
  className: string;
  language: string;
  label: string;
  best: number;
  degree: number;
  tone: Tone;
}

const W = 920;
const H = 560;

const toneFill: Record<Tone, string> = {
  innocent: "#1976b8",
  plagiarism: "#f59e0b",
};

const toneSoft: Record<Tone, string> = {
  innocent: "rgba(25,118,184,0.12)",
  plagiarism: "rgba(245,158,11,0.16)",
};

function buildNodes(): Node[] {
  const best = new Map<string, number>();
  const degree = new Map<string, number>();

  for (const p of pairRelations) {
    best.set(p.aId, Math.max(best.get(p.aId) ?? 0, p.similarity));
    best.set(p.bId, Math.max(best.get(p.bId) ?? 0, p.similarity));
    degree.set(p.aId, (degree.get(p.aId) ?? 0) + 1);
    degree.set(p.bId, (degree.get(p.bId) ?? 0) + 1);
  }

  return mockSubmissions.map((s) => {
    const b = Math.max(s.similarity, best.get(s.id) ?? 0);
    return {
      id: s.id,
      fileName: s.fileName,
      studentCode: s.studentCode,
      studentName: s.studentName,
      className: s.className,
      language: s.language,
      label: s.label,
      best: b,
      degree: degree.get(s.id) ?? 0,
      tone: s.label === "innocent" ? "innocent" : "plagiarism",
    };
  });
}

function buildClusters(nodes: Node[]) {
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    return p === x ? x : (parent.set(x, find(p)), parent.get(x) ?? x);
  };
  for (const p of pairRelations) parent.set(find(p.aId), find(p.bId));

  const groups = new Map<string, string[]>();
  for (const n of nodes) {
    const root = find(n.id);
    const arr = groups.get(root) ?? [];
    arr.push(n.id);
    groups.set(root, arr);
  }

  const clusters = [...groups.values()]
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length);

  const meta = clusters.map((ids) => {
    const maxSim = Math.max(
      ...ids.flatMap((id) =>
        pairRelations.filter((p) => p.aId === id || p.bId === id).map((p) => p.similarity),
      ),
    );
    return { ids, maxSim };
  });

  return meta;
}

// ---------------------------------------------------------------------------
// Layout cố định: cụm chính ở giữa, các cụm nhỏ vòng quanh, bài lẻ loi nằm
// thành một hàng mờ ở đáy. Động phòng-theo-thế-giới (gravity/spring) đơn giản
// để node luôn trôi về vị trí cân bằng.
// ---------------------------------------------------------------------------

interface Placed {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function seedLayout(nodes: Node[]) {
  const clusters = buildClusters(nodes);
  const placed = new Map<string, Placed>();

  const centers = clusters.map((_, ci) => {
    const n = clusters.length;
    const angle = (ci / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    const dist = n <= 1 ? 0 : 150;
    return { x: W / 2 + dist * Math.cos(angle), y: H / 2 - 30 + dist * Math.sin(angle) };
  });

  const degree = new Map<string, number>();
  for (const p of pairRelations) {
    degree.set(p.aId, (degree.get(p.aId) ?? 0) + 1);
    degree.set(p.bId, (degree.get(p.bId) ?? 0) + 1);
  }

  clusters.forEach(({ ids }, ci) => {
    const c = centers[ci];
    ids.forEach((id, i) => {
      if (ids.length === 1) {
        placed.set(id, { x: c.x, y: c.y, vx: 0, vy: 0, r: 12 });
        return;
      }
      const angle = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
      const orbit = ids.length <= 3 ? 34 : ids.length <= 5 ? 46 : 58;
      placed.set(id, {
        x: c.x + orbit * Math.cos(angle),
        y: c.y + orbit * Math.sin(angle),
        vx: 0,
        vy: 0,
        r: 10,
      });
    });
    const hub = ids.reduce(
      (b, id) => ((degree.get(id) ?? 0) > (degree.get(b) ?? 0) ? id : b),
      ids[0],
    );
    placed.set(hub, { x: c.x, y: c.y, vx: 0, vy: 0, r: 13 });
  });

  const orphaned = nodes.filter((n) => !placed.has(n.id));
  orphaned.forEach((n, i) => {
    placed.set(n.id, { x: 120 + i * 56, y: H - 56, vx: 0, vy: 0, r: 8 });
  });

  return { clusters, placed };
}

export default function RelationsPage() {
  const [threshold, setThreshold] = useState(70);
  const [showSingletons, setShowSingletons] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const dragRef = useRef<string | null>(null);
  const movedRef = useRef(false);

  const nodes = useMemo(buildNodes, []);
  const nodeOf = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const { placed } = useMemo(() => seedLayout(nodes), [nodes]);

  const { clusters } = useMemo(() => seedLayout(nodes), [nodes]);

  const visibleEdges = pairRelations.filter((p) => p.similarity >= threshold);
  const visibleIds = new Set(visibleEdges.flatMap((p) => [p.aId, p.bId]));
  const visibleNodes = nodes.filter(
    (n) => showSingletons || visibleIds.has(n.id) || active === n.id,
  );

  const activeNode = active ? nodeOf.get(active) : null;
  const activeEdges = active
    ? visibleEdges.filter((p) => p.aId === active || p.bId === active)
    : [];
  const partnerIds = new Set(activeEdges.map((e) => (e.aId === active ? e.bId : e.aId)));

  const searchHits = query
    ? nodes.filter((s) =>
        [s.fileName, s.studentName, s.studentCode].some((v) =>
          v.toLowerCase().includes(query.toLowerCase()),
        ),
      )
    : [];

  const stats = [
    { k: "Cặp trên ngưỡng", v: `${visibleEdges.length}` },
    { k: "Bài có liên hệ", v: `${visibleIds.size}` },
    { k: "Cụm liên kết", v: `${clusters.filter((c) => c.maxSim >= threshold).length}` },
  ];

  const onNodeStart = (id: string) => {
    dragRef.current = id;
    movedRef.current = false;
    setActive(id);
  };

  const onMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    movedRef.current = true;
    const svg = (e.currentTarget as unknown as { closest: (s: string) => HTMLElement | null }).closest("svg");
    const rect = svg?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const p = placed.get(dragRef.current);
    if (!p) return;
    p.x = Math.max(18, Math.min(W - 18, x));
    p.y = Math.max(18, Math.min(H - 18, y));
  };

  const onUp = () => {
    dragRef.current = null;
  };

  const resetLayout = () => {
    const fresh = seedLayout(nodes);
    for (const [id, p] of placed) {
      const f = fresh.placed.get(id);
      if (f) {
        p.x = f.x;
        p.y = f.y;
        p.vx = 0;
        p.vy = 0;
      }
    }
    setTick((v) => v + 1);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-200 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">CODEX / Quan hệ</p>
        <h1 className="mt-2 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          <FaChartSimple className="text-stone-500" /> Biểu đồ quan hệ bài đạo văn
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Nền trắng tối giản như DOLOS: chấm xanh là bài sạch, chấm cam là bài đạo văn.
          Kéo một chấm để sắp xếp, nhấn để xem các bài liên hệ.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="border border-stone-200 bg-white p-4 xl:col-span-2" style={{ borderRadius: 10 }}>
          <div className="relative mb-3 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 text-sm text-stone-600">
                <span className="shrink-0 text-xs font-medium text-stone-500">
                  Ngưỡng: <strong className="text-stone-900">{threshold}%</strong>
                </span>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-stone-900"
                  aria-label="Ngưỡng tương đồng"
                />
                <button
                  type="button"
                  onClick={resetLayout}
                  title="Đặt lại bố cục"
                  className="shrink-0 text-stone-400 hover:text-stone-900"
                >
                  <FaRotateRight className="text-sm" />
                </button>
              </label>
            </div>
            <div className="relative min-w-[180px] flex-1">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm bài nộp…"
                className="w-full border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 focus:border-stone-900 focus:outline-none"
                style={{ borderRadius: 7 }}
              />
            </div>
            <div className="ml-auto flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5" style={{ background: toneFill.innocent }} />
                innocent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5" style={{ background: toneFill.plagiarism }} />
                plagiarism
              </span>
            </div>
          </div>

          {searchHits.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {searchHits.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200"
                >
                  {s.fileName} — {s.studentName}
                </button>
              ))}
            </div>
          )}

          <div className="relative overflow-hidden bg-white" style={{ minHeight: 420 }}>
            <svg
              key={tick}
              viewBox={`0 0 ${W} ${H}`}
              className="block w-full select-none"
              role="img"
              aria-label="Biểu đồ quan hệ các bài nộp"
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
            >
              {visibleEdges.map((e) => {
                const a = placed.get(e.aId);
                const b = placed.get(e.bId);
                if (!a || !b) return null;
                const focused = active === e.aId || active === e.bId;
                const dim = active !== null && !focused;
                const col = toneFill[nodeOf.get(e.aId)?.tone ?? "innocent"];
                return (
                  <g key={e.id} opacity={dim ? 0.18 : 1} className="transition-opacity duration-150">
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={focused ? "#0c0a09" : "#a3a3a3"}
                      strokeWidth={focused ? 2 : 1.2}
                    />
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill={col}
                      fontWeight={focused ? 700 : 600}
                      style={{ pointerEvents: "none" }}
                    >
                      {e.similarity}%
                    </text>
                  </g>
                );
              })}

              {visibleNodes.map((n) => {
                const p = placed.get(n.id)!;
                const selected = active === n.id;
                const linked = partnerIds.has(n.id);
                const dim = active !== null && !selected && !linked;
                return (
                  <g
                    key={n.id}
                    opacity={dim ? 0.4 : 1}
                    className="transition-opacity duration-150"
                    style={{ cursor: "grab" }}
                    onMouseDown={() => onNodeStart(n.id)}
                    onClick={() => {
                      if (!movedRef.current) setActive(selected ? null : n.id);
                      movedRef.current = false;
                    }}
                  >
                    {(selected || linked) && (
                      <circle cx={p.x} cy={p.y} r={p.r + 10} fill={toneSoft[n.tone]} />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={p.r}
                      fill={toneFill[n.tone]}
                      stroke={selected ? "#0c0a09" : "none"}
                      strokeWidth={selected ? 2 : 0}
                    />
                    <text
                      x={p.x}
                      y={p.y + p.r + 14}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={selected ? 700 : 500}
                      fill="#292524"
                      style={{ pointerEvents: "none" }}
                    >
                      {n.fileName.replace(/\.\w+$/, "")}
                    </text>
                    <title>{`${n.fileName} — ${n.studentName} · cao nhất ${n.best}%`}</title>
                  </g>
                );
              })}
            </svg>

            {/* Điều khiển dưới dạng DOLOS */}
            <div className="pointer-events-none absolute inset-x-4 bottom-3 flex items-end justify-between">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="pointer-events-auto inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: paused ? "#78716c" : "#f59e0b" }}
              >
                {paused ? <FaPlay className="text-xs" /> : <FaPause className="text-xs" />}
                {paused ? "Play" : "Pause"}
              </button>

              <div className="pointer-events-auto flex flex-col items-end gap-2">
                <span className="text-xs text-stone-500">Threshold ≥ {threshold}%</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-40 accent-stone-900"
                    aria-label="Ngưỡng tương đồng"
                  />
                  <button
                    type="button"
                    onClick={resetLayout}
                    title="Đặt lại bố cục"
                    className="text-stone-400 hover:text-stone-900"
                  >
                    <FaRotateRight className="text-sm" />
                  </button>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={showSingletons}
                    onChange={(e) => setShowSingletons(e.target.checked)}
                    className="h-4 w-4 accent-stone-900"
                  />
                  Display singletons
                </label>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.k} className="border border-stone-200 bg-white p-3 text-center" style={{ borderRadius: 10 }}>
                <p className="font-serif text-2xl font-semibold text-stone-900">{s.v}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-stone-500">{s.k}</p>
              </div>
            ))}
          </div>

          <div className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <h2 className="text-sm font-semibold text-stone-900">
              {activeNode ? `${activeNode.fileName} — ${activeNode.studentName}` : "Chưa chọn bài nào"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {activeNode
                ? `Tương đồng cao nhất ${activeNode.best}% · có ${activeEdges.length} cặp trên ngưỡng ${threshold}%.`
                : "Nhấn vào một chấm để xem các bài liên hệ với nó."}
            </p>

            <ul className="mt-3 space-y-2">
              {activeEdges.map((e) => {
                const otherId = e.aId === active ? e.bId : e.aId;
                const other = nodeOf.get(otherId);
                if (!other) return null;
                return (
                  <li key={e.id}>
                    <div
                      className="flex w-full items-center gap-3 border border-stone-200 px-3 py-2"
                      style={{ borderRadius: 8 }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-stone-800">
                          {other.fileName} — {other.studentName}
                        </span>
                        <span className="block truncate text-xs text-stone-400">
                          {other.studentCode} · {other.className}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold" style={{ color: toneFill[other.tone] }}>
                        {e.similarity}%
                      </span>
                      <Link
                        to="/compare"
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                        title="So sánh hai bài này"
                      >
                        <FaCodeCompare /> So sánh
                        <FaArrowRight className="text-[10px]" />
                      </Link>
                    </div>
                  </li>
                );
              })}
              {activeEdges.length === 0 && (
                <li
                  className="border border-dashed border-stone-300 px-3 py-4 text-center text-xs text-stone-500"
                  style={{ borderRadius: 8 }}
                >
                  Bài này không còn cặp nào ở ngưỡng {threshold}% — hãy hạ ngưỡng xuống để xem thêm.
                </li>
              )}
            </ul>
          </div>

          <div className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <h2 className="text-sm font-semibold text-stone-900">Các cặp tương đồng cao nhất</h2>
            <ul className="mt-3 space-y-2">
              {pairRelations.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2 text-xs last:border-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate text-stone-700">
                    {p.aName} ↔ {p.bName}
                  </span>
                  <span className="shrink-0 font-bold" style={{ color: toneFill[nodeOf.get(p.aId)?.tone ?? "innocent"] }}>
                    {p.similarity}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

