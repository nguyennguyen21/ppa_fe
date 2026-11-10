import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent, WheelEvent } from "react";
import {
  FaArrowRight,
  FaChartSimple,
  FaCodeCompare,
  FaDownload,
  FaExpand,
  FaImage,
  FaKeyboard,
  FaMagnifyingGlass,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
  FaPause,
  FaPlay,
  FaRotateRight,
  FaTable,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import type { Submission } from "../data/types";
import type { PairRelation } from "../data/types";
import { useBackendData } from "../modules/lib/hook/backend-data-context";
import { useToast } from "../modules/lib/Components/UI/feedback/Toast";

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
  innocent: "var(--node-innocent)",
  plagiarism: "var(--node-plagiarism)",
};

const toneLabel: Record<Tone, string> = {
  innocent: "Bài sạch",
  plagiarism: "Có dấu hiệu",
};

const toneSoft: Record<Tone, string> = {
  innocent: "var(--node-innocent-soft)",
  plagiarism: "var(--node-plagiarism-soft)",
};

function buildNodes(submissions: Submission[], pairs: PairRelation[]): Node[] {
  const best = new Map<string, number>();
  const degree = new Map<string, number>();

  for (const p of pairs) {
    best.set(p.aId, Math.max(best.get(p.aId) ?? 0, p.similarity));
    best.set(p.bId, Math.max(best.get(p.bId) ?? 0, p.similarity));
    degree.set(p.aId, (degree.get(p.aId) ?? 0) + 1);
    degree.set(p.bId, (degree.get(p.bId) ?? 0) + 1);
  }

  return submissions.map((s) => {
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

function buildClusters(nodes: Node[], pairs: PairRelation[]) {
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    return p === x ? x : (parent.set(x, find(p)), parent.get(x) ?? x);
  };
  for (const p of pairs) parent.set(find(p.aId), find(p.bId));

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
        pairs.filter((p) => p.aId === id || p.bId === id).map((p) => p.similarity),
      ),
    );
    return { ids, maxSim };
  });

  return meta;
}

// ---------------------------------------------------------------------------
// Layout cố định: cụm chính ở giữa, các cụm nhỏ vòng quanh, bài lẻ loi nằm
// thành một hàng mờ ở đáy.
// ---------------------------------------------------------------------------

interface Placed {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function seedLayout(nodes: Node[], pairs: PairRelation[]) {
  const clusters = buildClusters(nodes, pairs);
  const placed = new Map<string, Placed>();

  const centers = clusters.map((_, ci) => {
    const n = clusters.length;
    const angle = (ci / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    const dist = n <= 1 ? 0 : 150;
    return { x: W / 2 + dist * Math.cos(angle), y: H / 2 - 30 + dist * Math.sin(angle) };
  });

  const degree = new Map<string, number>();
  for (const p of pairs) {
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

interface ViewTransform {
  x: number;
  y: number;
  k: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const zoomAround = (view: ViewTransform, factor: number, cx = W / 2, cy = H / 2): ViewTransform => {
  const k = clamp(view.k * factor, 0.35, 3.5);
  return {
    k,
    x: cx - (cx - view.x) * (k / view.k),
    y: cy - (cy - view.y) * (k / view.k),
  };
};

const fitTransform = (points: Placed[]): ViewTransform => {
  if (points.length === 0) return { x: 0, y: 0, k: 1 };
  const pad = 52;
  const minX = Math.min(...points.map((p) => p.x)) - pad;
  const maxX = Math.max(...points.map((p) => p.x)) + pad;
  const minY = Math.min(...points.map((p) => p.y)) - pad;
  const maxY = Math.max(...points.map((p) => p.y)) + pad;
  const k = clamp(Math.min(W / (maxX - minX), H / (maxY - minY)), 0.4, 1.8);
  return {
    k,
    x: W / 2 - (k * (minX + maxX)) / 2,
    y: H / 2 - (k * (minY + maxY)) / 2,
  };
};

/** Khung nhìn ban đầu được căn theo đúng các bài đang hiển thị ở ngưỡng mặc định. */
const DEFAULT_THRESHOLD = 70;

export default function RelationsPage() {
  const toast = useToast();
  // Nguồn dữ liệu THẬT từ backend (UI giữ nguyên 100%).
  const { submissions: mockSubmissions, pairs: pairRelations } = useBackendData();
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [showSingletons, setShowSingletons] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [panning, setPanning] = useState(false);
  const [query, setQuery] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [hoverEdge, setHoverEdge] = useState<{
    x: number;
    y: number;
    a: Node;
    b: Node;
    similarity: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<string | null>(null);
  const panRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const movedRef = useRef(false);

  const nodes = useMemo(() => buildNodes(mockSubmissions, pairRelations), [mockSubmissions, pairRelations]);
  const nodeOf = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const initialLayout = useMemo(() => seedLayout(nodes, pairRelations), [nodes, pairRelations]);
  const defaultVisiblePoints = useMemo(() => {
    const ids = new Set(
      pairRelations
        .filter((pair) => pair.similarity >= DEFAULT_THRESHOLD)
        .flatMap((pair) => [pair.aId, pair.bId]),
    );
    return nodes
      .filter((node) => ids.has(node.id))
      .map((node) => initialLayout.placed.get(node.id))
      .filter((point): point is Placed => Boolean(point));
  }, [nodes, initialLayout, pairRelations]);
  const [placed, setPlaced] = useState<Map<string, Placed>>(
    () => initialLayout.placed,
  );
  const [view, setView] = useState<ViewTransform>(() =>
    fitTransform(defaultVisiblePoints),
  );
  const clusters = initialLayout.clusters;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent | globalThis.WheelEvent) => {
      event.preventDefault();
      const wheel = event as globalThis.WheelEvent;
      const rect = svg.getBoundingClientRect();
      const cx = ((wheel.clientX - rect.left) / rect.width) * W;
      const cy = ((wheel.clientY - rect.top) / rect.height) * H;
      setView((current) => zoomAround(current, wheel.deltaY < 0 ? 1.12 : 0.89, cx, cy));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

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

  const toWorld = (event: MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const sx = ((event.clientX - rect.left) / rect.width) * W;
    const sy = ((event.clientY - rect.top) / rect.height) * H;
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k };
  };

  const onNodeStart = (id: string) => {
    if (paused) {
      setActive(id);
      return;
    }
    dragRef.current = id;
    movedRef.current = false;
    setActive(id);
  };

  const onSvgMouseDown = (event: MouseEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest("[data-node]")) return;
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: view.x,
      originY: view.y,
    };
    movedRef.current = false;
    setPanning(true);
  };

  const onMove = (event: MouseEvent<SVGSVGElement>) => {
    if (panRef.current) {
      movedRef.current = true;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((event.clientX - panRef.current.x) / rect.width) * W;
      const dy = ((event.clientY - panRef.current.y) / rect.height) * H;
      setView((current) => ({
        ...current,
        x: panRef.current ? panRef.current.originX + dx : current.x,
        y: panRef.current ? panRef.current.originY + dy : current.y,
      }));
      return;
    }

    if (!dragRef.current) return;
    movedRef.current = true;
    const point = toWorld(event);
    if (!point) return;
    const id = dragRef.current;
    setPlaced((current) => {
      const p = current.get(id);
      if (!p) return current;
      const next = new Map(current);
      next.set(id, {
        ...p,
        x: Math.max(18, Math.min(W - 18, point.x)),
        y: Math.max(18, Math.min(H - 18, point.y)),
      });
      return next;
    });
  };

  const onUp = () => {
    dragRef.current = null;
    panRef.current = null;
    setPanning(false);
  };

  const resetLayout = () => {
    const fresh = seedLayout(nodes, pairRelations);
    setPlaced(fresh.placed);
    setView(fitTransform(defaultVisiblePoints));
  };

  const fitView = () => {
    const points = visibleNodes
      .map((node) => placed.get(node.id))
      .filter((point): point is Placed => Boolean(point));
    setView(fitTransform(points));
  };

  // Ẩn nhãn khi mạng quá dày để tránh chồng chữ (threshold thấp / nhiều node).
  const dense = visibleNodes.length > 8 || threshold <= 55;
  const shouldShowLabel = (id: string) =>
    !dense || id === active || partnerIds.has(id) || id === focusedNode;

  const exportSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(W));
      clone.setAttribute("height", String(H));
      // Thay CSS variables bằng màu thực để file xuất không bị trắng.
      const cs = getComputedStyle(document.documentElement);
      const inoc = cs.getPropertyValue("--node-innocent").trim() || "#1976b8";
      const plag = cs.getPropertyValue("--node-plagiarism").trim() || "#d97706";
      const inocSoft = cs.getPropertyValue("--node-innocent-soft").trim() || "rgba(25,118,184,0.12)";
      const plagSoft = cs.getPropertyValue("--node-plagiarism-soft").trim() || "rgba(245,158,11,0.18)";
      clone.querySelectorAll("circle").forEach((c) => {
        const fill = c.getAttribute("fill") ?? "";
        if (fill.includes("innocent")) c.setAttribute("fill", inoc);
        if (fill.includes("plagiarism")) c.setAttribute("fill", plag);
        if (fill.includes("innocent-soft")) c.setAttribute("fill", inocSoft);
        if (fill.includes("plagiarism-soft")) c.setAttribute("fill", plagSoft);
      });
      clone.querySelectorAll("text").forEach((t) => {
        t.setAttribute("font-family", "Inter, sans-serif");
        t.setAttribute("fill", "#262524");
      });
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", "#ffffff");
      clone.insertBefore(rect, clone.firstChild);
      const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "codex-bieu-do-quan-he.svg";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất SVG", "File vector đã được tải xuống.");
    } catch {
      toast.error("Không xuất được SVG", "Trình duyệt đã chặn thao tác. Hãy thử lại.");
    }
  };

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const cs = getComputedStyle(document.documentElement);
      clone.setAttribute("width", String(W));
      clone.setAttribute("height", String(H));
      clone.querySelectorAll("circle").forEach((c) => {
        const fill = c.getAttribute("fill") ?? "";
        if (fill.includes("innocent")) c.setAttribute("fill", cs.getPropertyValue("--node-innocent").trim() || "#1976b8");
        if (fill.includes("plagiarism")) c.setAttribute("fill", cs.getPropertyValue("--node-plagiarism").trim() || "#d97706");
      });
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", "#ffffff");
      clone.insertBefore(rect, clone.firstChild);
      const svgText = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = W * 2;
        canvas.height = H * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "codex-bieu-do-quan-he.png";
          a.click();
          toast.success("Đã xuất PNG", "Ảnh biểu đồ đã được tải xuống.");
        });
      };
      img.src = url;
    } catch {
      toast.error("Không xuất được PNG", "Trình duyệt đã chặn thao tác. Hãy thử lại.");
    }
  };

  // Điều khiển bằng bàn phím: mũi tên pan, +/- zoom, 0 vừa khung, Esc bỏ chọn.
  const onChartKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 60 : 24;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setView((v) => ({ ...v, x: v.x + step }));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setView((v) => ({ ...v, x: v.x - step }));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setView((v) => ({ ...v, y: v.y + step }));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setView((v) => ({ ...v, y: v.y - step }));
    } else if (event.key === "+" || event.key === "=") {
      setView((v) => zoomAround(v, 1.2));
    } else if (event.key === "-" || event.key === "_") {
      setView((v) => zoomAround(v, 0.83));
    } else if (event.key === "0") {
      fitView();
    } else if (event.key === "Escape") {
      setActive(null);
      setFocusedNode(null);
    }
  };

  const edgeTip = hoverEdge
    ? {
        left: `${((hoverEdge.x * view.k + view.x) / W) * 100}%`,
        top: `${((hoverEdge.y * view.k + view.y) / H) * 100}%`,
      }
    : null;

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">CODEX / Quan hệ</p>
        <h1 className="mt-2 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          <FaChartSimple className="text-stone-600" /> Biểu đồ quan hệ bài đạo văn
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Chấm xanh là bài sạch, chấm cam là bài có dấu hiệu đạo văn. Kéo một chấm để sắp xếp,
          kéo vùng trống để di chuyển, lăn chuột để thu phóng.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="border border-stone-200 bg-white p-4 xl:col-span-2" style={{ borderRadius: 10 }}>
          <div className="relative mb-3 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 text-sm text-stone-700">
                <span className="shrink-0 text-xs font-medium text-stone-600">
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
                  data-guide="relations-reset"
                  className="shrink-0 text-stone-600 hover:text-stone-900"
                >
                  <FaRotateRight className="text-sm" />
                </button>
              </label>
            </div>
            <div className="relative min-w-[180px] flex-1">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm bài nộp…"
                className="w-full border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 focus:border-stone-900 focus:outline-none"
                style={{ borderRadius: 7 }}
              />
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
              <button
                type="button"
                onClick={() => setShowTable((v) => !v)}
                aria-pressed={showTable}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${showTable ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}
                title="Xem dạng bảng (dùng cho trình đọc màn hình)"
              >
                <FaTable /> Bảng
              </button>
              <button
                type="button"
                onClick={exportSvg}
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                title="Xuất biểu đồ dạng SVG"
              >
                <FaDownload /> SVG
              </button>
              <button
                type="button"
                onClick={exportPng}
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                title="Xuất biểu đồ dạng PNG"
              >
                <FaImage /> PNG
              </button>
              <button
                type="button"
                onClick={() => setShowKeyboardHelp((v) => !v)}
                aria-expanded={showKeyboardHelp}
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                title="Phím tắt bàn phím"
              >
                <FaKeyboard /> Phím tắt
              </button>
              <span className="ml-1 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: toneFill.innocent }} />
                Bài sạch
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: toneFill.plagiarism }} />
                Có dấu hiệu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-px w-4 bg-stone-500" /> Cặp ≥ {threshold}%
              </span>
            </div>
          </div>

          {showKeyboardHelp && (
            <div className="mb-3 border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700" style={{ borderRadius: 8 }} role="note" aria-label="Phím tắt bàn phím">
              <strong>Phím tắt:</strong> Tab để vào biểu đồ → Mũi tên di chuyển · + / − thu phóng · 0 vừa khung · Esc bỏ chọn ·
              Tab tiếp tới từng chấm để chọn bằng Enter. Giữ Shift + mũi tên để di chuyển xa hơn.
            </div>
          )}
          {dense && (
            <div className="mb-3 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" style={{ borderRadius: 8 }} role="note">
              Đang ẩn nhãn nền để tránh chồng chữ (nhiều điểm). Nhấn vào một chấm hoặc dùng dạng Bảng để xem đầy đủ tên bài.
            </div>
          )}

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

          <div
            className="relative overflow-hidden bg-white"
            style={{ minHeight: 420 }}
            tabIndex={0}
            role="application"
            aria-label="Khung biểu đồ. Dùng mũi tên để di chuyển, cộng trừ để thu phóng, 0 để vừa khung."
            onKeyDown={onChartKeyDown}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="block w-full select-none"
              role="img"
              aria-label="Biểu đồ quan hệ các bài nộp"
              onMouseDown={onSvgMouseDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              style={{ cursor: panning ? "grabbing" : "grab" }}
            >
              <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
                {visibleEdges.map((e) => {
                  const a = placed.get(e.aId);
                  const b = placed.get(e.bId);
                  const nodeA = nodeOf.get(e.aId);
                  const nodeB = nodeOf.get(e.bId);
                  if (!a || !b || !nodeA || !nodeB) return null;
                  const focused = active === e.aId || active === e.bId;
                  const dim = active !== null && !focused;
                  const col = toneFill[nodeA.tone];
                  const midX = (a.x + b.x) / 2;
                  const midY = (a.y + b.y) / 2;
                  return (
                    <g
                      key={e.id}
                      opacity={dim ? 0.18 : 1}
                      className="transition-opacity duration-150"
                      onMouseEnter={() =>
                        setHoverEdge({ x: midX, y: midY, a: nodeA, b: nodeB, similarity: e.similarity })
                      }
                      onMouseLeave={() => setHoverEdge(null)}
                    >
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={focused ? "currentColor" : "#a3a3a3"}
                        className={focused ? "text-stone-900" : ""}
                        strokeWidth={focused ? 2 : 1.2}
                      />
                      <text
                        x={midX}
                        y={midY - 5}
                        textAnchor="middle"
                        fontSize="11"
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
                  const p = placed.get(n.id);
                  if (!p) return null;
                  const selected = active === n.id;
                  const linked = partnerIds.has(n.id);
                  const dim = active !== null && !selected && !linked;
                  return (
                    <g
                      key={n.id}
                      data-node
                      tabIndex={0}
                      role="button"
                      aria-label={`${n.fileName}, ${n.studentName}, tương đồng cao nhất ${n.best}%`}
                      opacity={dim ? 0.4 : 1}
                      className="transition-opacity duration-150 outline-none"
                      style={{ cursor: paused ? "pointer" : "grab" }}
                      onMouseDown={() => onNodeStart(n.id)}
                      onMouseEnter={() => setFocusedNode(n.id)}
                      onFocus={() => setFocusedNode(n.id)}
                      onBlur={() => setFocusedNode(null)}
                      onClick={() => {
                        if (!movedRef.current) setActive(selected ? null : n.id);
                        movedRef.current = false;
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setActive(selected ? null : n.id);
                        }
                      }}
                    >
                      <title>{`${n.fileName} — ${n.studentName} · ${n.best}%`}</title>
                      {(selected || linked) && (
                        <circle cx={p.x} cy={p.y} r={p.r + 10} fill={toneSoft[n.tone]} />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={focusedNode === n.id ? p.r + 2 : p.r}
                        fill={toneFill[n.tone]}
                        stroke={selected || focusedNode === n.id ? "currentColor" : "none"}
                        className={selected || focusedNode === n.id ? "text-stone-900" : ""}
                        strokeWidth={selected || focusedNode === n.id ? 2 : 0}
                      />
                      {shouldShowLabel(n.id) && (
                        <text
                          x={p.x}
                          y={p.y + p.r + 14}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight={selected ? 700 : 500}
                          fill="currentColor"
                          className="text-stone-900"
                          style={{ pointerEvents: "none", paintOrder: "stroke", stroke: "#ffffff", strokeWidth: 3 }}
                        >
                          {n.fileName.replace(/\.\w+$/, "")}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {hoverEdge && edgeTip && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full border border-stone-200 bg-white px-2.5 py-2 text-xs shadow-lg"
                style={{ left: edgeTip.left, top: edgeTip.top, borderRadius: 8 }}
                role="tooltip"
              >
                <p className="font-semibold text-stone-900">
                  {hoverEdge.a.fileName} ↔ {hoverEdge.b.fileName}
                </p>
                <p className="mt-0.5 text-stone-600">
                  {hoverEdge.a.studentName} · {hoverEdge.b.studentName}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  Tương đồng {hoverEdge.similarity}%
                </p>
              </div>
            )}

            {/* Zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col overflow-hidden border border-stone-200 bg-white shadow-sm" style={{ borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => setView((current) => zoomAround(current, 1.25))}
                aria-label="Phóng to biểu đồ"
                data-guide="relations-zoom"
                className="flex h-8 w-8 items-center justify-center text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                <FaMagnifyingGlassPlus size={12} />
              </button>
              <button
                type="button"
                onClick={() => setView((current) => zoomAround(current, 0.8))}
                aria-label="Thu nhỏ biểu đồ"
                className="flex h-8 w-8 items-center justify-center border-t border-stone-100 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                <FaMagnifyingGlassMinus size={12} />
              </button>
              <button
                type="button"
                onClick={fitView}
                aria-label="Thu phóng vừa khung"
                title="Vừa khung"
                data-guide="relations-fit"
                className="flex h-8 w-8 items-center justify-center border-t border-stone-100 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                <FaExpand size={11} />
              </button>
            </div>

            {/* Điều khiển nhanh trên biểu đồ */}
            <div className="pointer-events-none absolute inset-x-4 bottom-3 flex flex-wrap items-end justify-between gap-3">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                title={paused ? "Cho phép kéo các chấm" : "Tạm dừng kéo các chấm để giữ nguyên bố cục"}
                className="pointer-events-auto inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: paused ? "#78716c" : "#f59e0b" }}
              >
                {paused ? <FaPlay className="text-xs" /> : <FaPause className="text-xs" />}
                {paused ? "Tiếp tục kéo" : "Tạm dừng kéo"}
              </button>

              <label className="pointer-events-auto flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={showSingletons}
                  onChange={(e) => setShowSingletons(e.target.checked)}
                  className="h-4 w-4 accent-stone-900"
                />
                Hiện bài lẻ
              </label>
            </div>
          </div>

          {showTable && (
            <div className="mt-4 overflow-auto border border-stone-200" style={{ borderRadius: 8 }} role="region" aria-label="Bảng cặp tương đồng">
              <table className="w-full border-collapse text-xs">
                <caption className="p-3 text-left text-stone-600">
                  {visibleEdges.length} cặp có tương đồng ≥ {threshold}% (dạng bảng thay cho biểu đồ).
                </caption>
                <thead>
                  <tr className="bg-stone-50 text-left text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    <th className="px-3 py-2">Bài A</th>
                    <th className="px-3 py-2">Sinh viên A</th>
                    <th className="px-3 py-2">Bài B</th>
                    <th className="px-3 py-2">Sinh viên B</th>
                    <th className="px-3 py-2 text-right">Tương đồng</th>
                    <th className="px-3 py-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEdges.map((e) => {
                    const na = nodeOf.get(e.aId);
                    const nb = nodeOf.get(e.bId);
                    if (!na || !nb) return null;
                    return (
                      <tr key={e.id} className="border-t border-stone-100 dark:border-stone-700">
                        <td className="px-3 py-2 font-medium">{na.fileName}</td>
                        <td className="px-3 py-2">{na.studentName}</td>
                        <td className="px-3 py-2 font-medium">{nb.fileName}</td>
                        <td className="px-3 py-2">{nb.studentName}</td>
                        <td className="px-3 py-2 text-right font-bold">{e.similarity}%</td>
                        <td className="px-3 py-2">
                          <Link
                            to={`/compare?a=${encodeURIComponent(na.fileName)}&b=${encodeURIComponent(nb.fileName)}`}
                            className="font-semibold text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
                          >
                            So sánh
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.k} className="border border-stone-200 bg-white p-3 text-center" style={{ borderRadius: 10 }}>
                <p className="font-serif text-2xl font-semibold text-stone-900">{s.v}</p>
                <p className="mt-0.5 text-xs leading-tight text-stone-600">{s.k}</p>
              </div>
            ))}
          </div>

          <div className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <h2 className="text-sm font-semibold text-stone-900">
              {activeNode ? `${activeNode.fileName} — ${activeNode.studentName}` : "Chưa chọn bài nào"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-stone-600">
              {activeNode
                ? `Tương đồng cao nhất ${activeNode.best}% · có ${activeEdges.length} cặp trên ngưỡng ${threshold}%.`
                : "Nhấn vào một chấm để xem các bài liên hệ với nó."}
            </p>

            <ul className="mt-3 space-y-2">
              {activeEdges.map((e) => {
                const otherId = e.aId === active ? e.bId : e.aId;
                const other = nodeOf.get(otherId);
                if (!other || !activeNode) return null;
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
                        <span className="block truncate text-xs text-stone-600">
                          {other.studentCode} · {other.className}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold" style={{ color: toneFill[other.tone] }}>
                        {e.similarity}%
                      </span>
                      <Link
                        to={`/compare?a=${encodeURIComponent(activeNode.fileName)}&b=${encodeURIComponent(other.fileName)}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        title="So sánh hai bài này"
                      >
                        <FaCodeCompare /> So sánh
                        <FaArrowRight className="text-xs" />
                      </Link>
                    </div>
                  </li>
                );
              })}
              {activeEdges.length === 0 && (
                <li
                  className="border border-dashed border-stone-300 px-3 py-4 text-center text-xs text-stone-600"
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
                    <span className="sr-only">{toneLabel[nodeOf.get(p.aId)?.tone ?? "innocent"]}: </span>
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
