import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaArrowsLeftRight, FaCheck, FaCodeCompare, FaCopy, FaLink, FaPrint } from "react-icons/fa6";
import type { Submission } from "../data/types";
import RouteSkeleton from "../modules/lib/Components/UI/feedback/RouteSkeleton";
import { useBackendData } from "../modules/lib/hook/backend-data-context";
import { useToast } from "../modules/lib/Components/UI/feedback/Toast";
import { usePrefs } from "../modules/lib/hook/prefs-context";

// ---------------------------------------------------------------------------
// Đối chiếu ở mức dòng:
//  - Dòng trống: KHÔNG tính vào tỉ lệ và KHÔNG tô (không có nội dung để đạo văn).
//  - Dòng chỉ có dấu (`{`, `}`, `};`...): chỉ tính khi nằm trong một khối
//    giống liền mạch — khớp theo ngữ cảnh, không tô lẻ tẻ.
//  - Dòng có nội dung: khớp theo token (Dice), không phụ thuộc vị trí dòng.
// ---------------------------------------------------------------------------

const SIM_THRESHOLD = 0.75;
const STRONG_MATCH = 0.9;

const tokenize = (line: string) =>
  line.toLowerCase().split(/[^a-z0-9_]+/g).filter(Boolean);

const normalize = (line: string) => line.trim().replace(/\s+/g, " ");

const isBlank = (line: string) => normalize(line) === "";

interface ScoredLine {
  text: string;
  /** 0..1 — độ giống với dòng được ghép bên kia; 0 = không ghép. */
  score: number;
  /** Dòng trống: không tính vào tỉ lệ, không tô. */
  blank: boolean;
}

/** Dice coefficient trên tập token — ổn định hơn đếm trùng thô. */
function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((t) => {
    if (b.has(t)) inter += 1;
  });
  return (2 * inter) / (a.size + b.size);
}

function scoreLines(aText: string, bText: string) {
  const la = aText.split("\n");
  const lb = bText.split("\n");
  const na = la.map(normalize);
  const nb = lb.map(normalize);
  const ta = na.map((l) => new Set(tokenize(l)));
  const tb = nb.map((l) => new Set(tokenize(l)));

  const scoreA = new Array<number>(la.length).fill(0);
  const scoreB = new Array<number>(lb.length).fill(0);
  const matchOfA = new Map<number, number>(); // dòng A -> dòng B
  const usedB = new Set<number>();

  // --- 1. Ghép các dòng có nội dung ---------------------------------------
  // Chỉ so những cặp có chung ít nhất một token (inverted index) để không
  // phải quét toàn bộ n×m.
  const bIndex = new Map<string, number[]>();
  tb.forEach((set, j) => {
    if (set.size === 0 || nb[j] === "") return;
    set.forEach((t) => {
      const arr = bIndex.get(t);
      if (arr) arr.push(j);
      else bIndex.set(t, [j]);
    });
  });

  const pairs: Array<{ i: number; j: number; s: number }> = [];
  for (let i = 0; i < la.length; i += 1) {
    if (na[i] === "" || ta[i].size === 0) continue;
    const candidates = new Set<number>();
    ta[i].forEach((t) => bIndex.get(t)?.forEach((j) => candidates.add(j)));
    candidates.forEach((j) => {
      if (nb[j] === "" || tb[j].size === 0) return;
      const s = dice(ta[i], tb[j]);
      if (s >= SIM_THRESHOLD) pairs.push({ i, j, s });
    });
  }
  pairs.sort((x, y) => y.s - x.s);

  for (const p of pairs) {
    if (matchOfA.has(p.i) || usedB.has(p.j)) continue;
    matchOfA.set(p.i, p.j);
    usedB.add(p.j);
    scoreA[p.i] = p.s;
    scoreB[p.j] = p.s;
  }

  // --- 2. Lấp các dòng nằm giữa hai mốc đã khớp cùng độ lệch -------------
  // (dấu ngoặc trong một khối copy). Chỉ lấp khi hai bên giống nhau từng
  // ký tự; dòng trống để nguyên vì không có nội dung.
  const fill = (i: number, j: number) => {
    if (scoreA[i] > 0 || scoreB[j] > 0) return;
    if (na[i] === "" || na[i] !== nb[j]) return;
    scoreA[i] = 1;
    scoreB[j] = 1;
    matchOfA.set(i, j);
  };

  const anchors = [...matchOfA.entries()]
    .map(([i, j]) => ({ i, j }))
    .sort((x, y) => x.i - y.i);

  for (let k = 0; k < anchors.length - 1; k += 1) {
    const p = anchors[k];
    const q = anchors[k + 1];
    const span = q.i - p.i;
    // Cùng độ lệch => là một khối liền mạch, không phải ghép ngẫu nhiên.
    if (span > 1 && span === q.j - p.j && span <= 40) {
      for (let t = 1; t < span; t += 1) fill(p.i + t, p.j + t);
    }
  }

  // --- 3. Dấu đóng/mở sát ngay khối giống (cùng độ lệch) -----------------
  let grew = true;
  let guard = 0;
  while (grew && guard < 3) {
    grew = false;
    guard += 1;
    for (const { i: ai, j: bj } of [...matchOfA.entries()].map(([i, j]) => ({ i, j: j }))) {
      for (const d of [1, -1]) {
        const i = ai + d;
        const j = bj + d;
        if (i < 0 || j < 0 || i >= la.length || j >= lb.length) continue;
        if (scoreA[i] > 0 || scoreB[j] > 0) continue;
        if (na[i] === "" || ta[i].size > 0) continue; // chỉ dòng dấu
        if (na[i] !== nb[j]) continue;
        scoreA[i] = 1;
        scoreB[j] = 1;
        matchOfA.set(i, j);
        grew = true;
      }
    }
  }

  const toLines = (lines: string[], scores: number[]): ScoredLine[] =>
    lines.map((text, i) => ({ text, score: scores[i] ?? 0, blank: isBlank(text) }));

  return { a: toLines(la, scoreA), b: toLines(lb, scoreB) };
}

/** Tỉ lệ giống — chỉ tính trên dòng có nội dung. */
const similarity = (lines: ScoredLine[]) => {
  const content = lines.filter((l) => !l.blank);
  if (content.length === 0) return 0;
  const matched = content.filter((l) => l.score >= SIM_THRESHOLD).length;
  return Math.round((matched / content.length) * 100);
};

/** Số dòng thực sự giống (không tính dòng trống). */
const matchedCount = (lines: ScoredLine[]) =>
  lines.filter((l) => !l.blank && l.score >= SIM_THRESHOLD).length;

function shadeSide(score: number, side: "A" | "B", blank: boolean) {
  if (blank || score < SIM_THRESHOLD) return "transparent";
  if (side === "A") return score >= STRONG_MATCH ? "var(--cmp-a-strong)" : "var(--cmp-a-weak)";
  return score >= STRONG_MATCH ? "var(--cmp-b-strong)" : "var(--cmp-b-weak)";
}

const LINE_H = 20; // khớp leading-5
const PAD_Y = 12; // khớp py-3
const VIEW_H = 300; // chiều cao tối đa; ngắn hơn thì khung co theo code

function CodeEditor({
  code,
  onChange,
  scoredLines,
  side,
  colorBlind,
}: {
  code: string;
  onChange: (v: string) => void;
  scoredLines: ScoredLine[];
  side: "A" | "B";
  colorBlind: boolean;
}) {
  const contentH = scoredLines.length * LINE_H + PAD_Y * 2;
  const longest = scoredLines.reduce((m, l) => Math.max(m, l.text.length), 0);
  const sameCount = matchedCount(scoredLines);
  const blankCount = scoredLines.filter((l) => l.blank).length;

  return (
    <div className="overflow-hidden border border-stone-200 bg-white" style={{ borderRadius: 10 }}>
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-50 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          {side} · {scoredLines.length} dòng
        </span>
        <span className="flex items-center gap-2 text-xs text-stone-500">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
            style={{
              background: side === "A" ? "var(--cmp-a-badge)" : "var(--cmp-b-badge)",
              color: side === "A" ? "var(--cmp-a-text)" : "var(--cmp-b-text)",
            }}
          >
            {sameCount} dòng giống
          </span>
          <span>{blankCount} dòng trống · không tính</span>
        </span>
      </div>

      {/*
        Một vùng cuộn duy nhất chứa số dòng + code + lớp highlight.
        Nhờ vậy màu nền luôn bám đúng dòng khi cuộn, và không lệch padding.
      */}
      <div
        className="relative bg-white"
        style={{ height: Math.min(VIEW_H, contentH), overflow: "auto" }}
      >
        <div
          className="flex"
          style={{ minWidth: "100%", width: `${Math.max(longest + 4, 40)}ch` }}
        >
          {/* Cột số dòng — dính bên trái khi cuộn ngang */}
          <div
            className="sticky left-0 z-20 shrink-0 select-none border-r border-stone-100 bg-white px-2 text-right font-mono text-[13px] leading-5 text-stone-300"
            style={{ height: contentH, paddingTop: PAD_Y, paddingBottom: PAD_Y }}
            aria-hidden
          >
            {scoredLines.map((_, i) => (
              <div key={i} style={{ height: LINE_H }}>
                {i + 1}
              </div>
            ))}
          </div>

          <div className="relative min-w-0 flex-1" style={{ height: contentH }}>
            {/* Lớp highlight NẰM DƯỚI chữ code */}
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
              <div style={{ paddingTop: PAD_Y, paddingBottom: PAD_Y }}>
                {scoredLines.map((l, i) => {
                  const bg = shadeSide(l.score, side, l.blank);
                  const matched = !l.blank && l.score >= SIM_THRESHOLD;
                  const strong = l.score >= STRONG_MATCH;
                  return (
                    <div
                      key={i}
                      className={matched && colorBlind ? "cmp-match-line" : undefined}
                      style={{
                        height: LINE_H,
                        background: bg,
                        // Chế độ mù màu: không phụ thuộc màu → thêm viền trái + nét đứt/nét liền.
                        borderLeft: matched && colorBlind ? `4px solid ${side === "A" ? "var(--cmp-a-text)" : "var(--cmp-b-text)"}` : "4px solid transparent",
                        borderBottom: matched && colorBlind ? (strong ? "2px solid currentColor" : "2px dotted currentColor") : "2px solid transparent",
                        color: side === "A" ? "var(--cmp-a-text)" : "var(--cmp-b-text)",
                        boxSizing: "border-box",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              wrap="off"
              className="relative z-10 block w-full resize-none bg-transparent font-mono text-[13px] leading-5 text-stone-900 caret-stone-900 focus:outline-none"
              style={{
                height: contentH,
                padding: `${PAD_Y}px 12px`,
                overflow: "hidden",
                whiteSpace: "pre",
              }}
              aria-label={`Chỉnh sửa code ${side}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bài nộp trống — chỉ dùng làm placeholder khi chưa có dữ liệu thật nào ở UI chọn bài. */
const emptySubmission: Submission = {
  id: "",
  fileName: "—",
  studentCode: "",
  studentName: "",
  className: "",
  language: "",
  label: "innocent",
  similarity: 0,
  size: "",
  uploadedAt: "",
  status: "done",
};

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  // Nguồn dữ liệu THẬT từ backend (UI giữ nguyên 100%).
  const { submissions: mockSubmissions, pairs: pairRelations, getSnippetCode } = useBackendData();
  const { colorBlind, setColorBlind } = usePrefs();
  const [mobileTab, setMobileTab] = useState<"A" | "B" | "both">("both");
  const list = useMemo(
    () => [...mockSubmissions].sort((x, y) => y.similarity - x.similarity),
    [mockSubmissions],
  );
  const initial = useMemo(() => {
    const find = (value: string | null) => {
      if (!value) return undefined;
      const normalized = value.toLowerCase();
      return list.find(
        (item) => item.id === value || item.fileName.toLowerCase() === normalized,
      );
    };
    const aParam = find(searchParams.get("a")) ?? find(searchParams.get("file"));
    const bParam = find(searchParams.get("b"));
    const a0 = aParam ?? list.at(0);
    let b0 = bParam;
    if (!b0) {
      const partner = pairRelations.find((pair) => pair.aId === a0?.id || pair.bId === a0?.id);
      const partnerId = partner ? (partner.aId === a0?.id ? partner.bId : partner.aId) : null;
      b0 = partnerId ? list.find((item) => item.id === partnerId) : undefined;
    }
    if (!b0 || b0.id === a0?.id) b0 = list.find((item) => item.id !== a0?.id) ?? list.at(1);
    const fromUrl = Boolean(aParam && (bParam || searchParams.get("file")));
    return {
      a: a0 ?? null,
      b: b0 ?? null,
      view: fromUrl ? ("compare" as const) : ("picker" as const),
    };
  }, [searchParams, list, pairRelations]);

  const [view, setView] = useState<"picker" | "compare">(initial.view);
  const [a, setA] = useState<Submission | null>(initial.a);
  const [b, setB] = useState<Submission | null>(initial.b);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [copied, setCopied] = useState<"A" | "B" | null>(null);

  // Cách chọn bài: chọn 1 trong 2 option
  const [pickMode, setPickMode] = useState<"pair" | "manual">("pair");
  const [selPair, setSelPair] = useState(pairRelations[0]?.id ?? "");

  const scored = useMemo(() => scoreLines(codeA, codeB), [codeA, codeB]);
  const pctA = similarity(scored.a);
  const pctB = similarity(scored.b);
  const currentPct = Math.round((pctA + pctB) / 2);

  const open = async (x: Submission, y: Submission) => {
    setA(x);
    setB(y);
    setView("compare");
    // Lấy code THẬT của hai bài từ backend (highlight endpoint tái tạo từng dòng).
    setCodeA("");
    setCodeB("");
    try {
      const [textX, textY] = await Promise.all([getSnippetCode(x.id), getSnippetCode(y.id)]);
      if (textX == null && textY == null) {
        toast.error(
          "Không tải được nội dung code",
          "Backend không trả về nội dung của cả hai bài — hãy kiểm tra dữ liệu đã được quét.",
        );
        return;
      }
      if (textX == null) {
        toast.error("Không tải được bài A", `Không tìm thấy nội dung của ${x.fileName} trên backend.`);
      }
      if (textY == null) {
        toast.error("Không tải được bài B", `Không tìm thấy nội dung của ${y.fileName} trên backend.`);
      }
      if (textX != null) setCodeA(textX);
      if (textY != null) setCodeB(textY);
    } catch {
      toast.error("Lỗi khi tải code", "Không nhận được nội dung code từ backend.");
    }
  };

  // Vào thẳng màn so sánh khi URL có ?a=&b= (hoặc ?file=) — ban đầu chưa có code, tải thật.
  useEffect(() => {
    if (initial.view === "compare" && initial.a && initial.b) {
      void open(initial.a, initial.b);
    }
    // chỉ chạy lúc mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swap = () => {
    if (!a || !b) return;
    const t = a;
    setA(b);
    setB(t);
    setCodeA(codeB);
    setCodeB(codeA);
  };

  const copy = async (side: "A" | "B") => {
    await navigator.clipboard.writeText(side === "A" ? codeA : codeB).catch(() => {});
    setCopied(side);
    toast.success(`Đã sao chép code bài ${side}`);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const labelText = (label: Submission["label"]) =>
    label === "plagiarism" ? "Cần xem lại" : label === "suspicious" ? "Nghi ngờ" : "Không có dấu hiệu";

  // Chưa chọn đủ hai bài (hoặc chưa có dữ liệu thật) → không render màn so sánh.
  if (view === "compare" && (!a || !b)) {
    return <RouteSkeleton />;
  }

  if (view === "picker") {
    const byId = new Map(mockSubmissions.map((s) => [s.id, s]));
    const aSel = a ?? list.at(0) ?? emptySubmission;
    const bSel = b ?? list.find((item) => item.id !== aSel.id) ?? list.at(1) ?? emptySubmission;
    const pairOptions = pairRelations
      .slice(0, 8)
      .map((p) => ({ p, left: byId.get(p.aId), right: byId.get(p.bId) }))
      .filter(
        (x): x is { p: (typeof pairRelations)[number]; left: Submission; right: Submission } =>
          Boolean(x.left && x.right),
      );

    const selectedPair = pairOptions.find((x) => x.p.id === selPair) ?? pairOptions[0];

    const modeCard = (mode: "pair" | "manual") => {
      const active = pickMode === mode;
      return {
        type: "button" as const,
        onClick: () => setPickMode(mode),
        "aria-pressed": active,
        className: `border px-4 py-3 text-left transition-colors ${
          active
            ? "border-stone-900 bg-stone-900 text-white"
            : "border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
        }`,
        style: { borderRadius: 10 },
      };
    };

    return (
      <div className="space-y-5">
        <div className="border-b border-stone-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">CODEX / So sánh</p>
          <h1 className="mt-2 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">
            <FaCodeCompare className="text-stone-600" /> Chọn hai bài để đối chiếu
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Chọn một trong hai cách bên dưới, rồi mở trang so sánh song song.
          </p>
        </div>

        {/* 2 option — chọn 1 trong 2 */}
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Cách chọn hai bài">
          <button {...modeCard("pair")}>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FaLink className={pickMode === "pair" ? "text-stone-300" : "text-stone-500"} />
              Cặp có điểm tương đồng cao
            </span>
            <span className={`mt-1 block text-xs ${pickMode === "pair" ? "text-stone-300" : "text-stone-600"}`}>
              Chọn từ danh sách cặp hệ thống đã phát hiện.
            </span>
          </button>
          <button {...modeCard("manual")}>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FaArrowsLeftRight className={pickMode === "manual" ? "text-stone-300" : "text-stone-500"} />
              Tự chọn hai bài
            </span>
            <span className={`mt-1 block text-xs ${pickMode === "manual" ? "text-stone-300" : "text-stone-600"}`}>
              Bấm chọn ô bài A và bài B trong danh sách.
            </span>
          </button>
        </div>

        {pickMode === "pair" ? (
          <section className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <label htmlFor="pair-select" className="mb-2 block text-sm font-semibold text-stone-900">
              Cặp bài tương đồng
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                id="pair-select"
                value={selectedPair?.p.id ?? ""}
                onChange={(e) => setSelPair(e.target.value)}
                className="min-w-[320px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                {pairOptions.map(({ p, left, right }) => (
                  <option key={p.id} value={p.id}>
                    {left.fileName} ↔ {right.fileName} · {left.studentName} vs {right.studentName} · {p.similarity}%
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedPair}
                onClick={() => selectedPair && void open(selectedPair.left, selectedPair.right)}
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40"
              >
                <FaCodeCompare /> Xem hai bài này
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-600">
              {selectedPair
                ? `${selectedPair.p.similarity}% tương đồng · ${labelText(selectedPair.left.label)}`
                : "Chưa có cặp nào được phát hiện."}
            </p>
          </section>
        ) : (
          <section className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["A", aSel, setA, bSel] as const,
                ["B", bSel, setB, aSel] as const,
              ]).map(([side, selected, setter, other]) => (
                <div key={side} className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-stone-900">Bài {side}</h2>
                    <span className="truncate text-xs text-stone-600">
                      {selected.fileName} · {selected.similarity}%
                    </span>
                  </div>

                  {/* Danh sách bài nộp — mỗi bài là một ô bấm chọn */}
                  <div
                    className="max-h-72 space-y-1.5 overflow-y-auto pr-1"
                    role="listbox"
                    aria-label={`Chọn bài ${side}`}
                  >
                    {list.map((s) => {
                      const disabled = s.id === other.id;
                      const active = s.id === selected.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          disabled={disabled}
                          onClick={() => setter(s)}
                          className={`flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors ${
                            active
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                          } ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
                          style={{ borderRadius: 8 }}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {s.fileName} — {s.studentName}
                            </span>
                            <span
                              className={`mt-0.5 block truncate text-xs ${
                                active ? "text-stone-300" : "text-stone-600"
                              }`}
                            >
                              {s.studentCode} · Lớp {s.className} · {labelText(s.label)}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-sm font-semibold ${
                              active ? "text-white" : s.similarity >= 80 ? "text-red-700" : "text-stone-600"
                            }`}
                          >
                            {s.similarity}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
              <p className="text-xs text-stone-600">
                <span className="font-medium text-stone-900">{aSel.fileName}</span>
                <span className="mx-1 text-stone-500">↔</span>
                <span className="font-medium text-stone-900">{bSel.fileName}</span>
              </p>
              <button
                type="button"
                onClick={() => void open(aSel, bSel)}
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
              >
                <FaCodeCompare /> Xem hai bài này
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }

  // Màn so sánh luôn cần đủ hai bài.
  if (!a || !b) {
    return <RouteSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">CODEX / So sánh</p>
          <h1 className="mt-2 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">
            <FaCodeCompare className="text-stone-600" /> So sánh hai đoạn code
          </h1>
        </div>
        <div className="flex items-center gap-4 border border-stone-200 bg-white px-5 py-3" style={{ borderRadius: 10 }}>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Tương đồng</p>
            <p className="font-serif text-3xl font-semibold text-red-700">{currentPct}%</p>
          </div>
          <div className="h-10 w-px bg-stone-200" />
          <div className="text-sm text-stone-600">
            <p>
              <span className="font-semibold text-stone-900">A {pctA}%</span> ·{" "}
              <span className="font-semibold text-stone-900">B {pctB}%</span>
            </p>
            <p className="text-xs text-stone-500">Càng xanh đậm càng giống</p>
          </div>
          <button
            onClick={swap}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            <FaArrowsLeftRight /> Đảo
          </button>
          <button
            onClick={() => setView("picker")}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            <FaArrowLeft /> Đổi bài
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            title="In trang so sánh này"
          >
            <FaPrint /> In
          </button>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-700">
            <input
              type="checkbox"
              checked={colorBlind}
              onChange={(e) => setColorBlind(e.target.checked)}
              className="h-4 w-4 accent-stone-900"
            />
            Mù màu
          </label>
        </div>
      </div>

      {/* Tabs cho mobile: tránh 2 cột bị ép */}
      <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 lg:hidden" role="tablist" aria-label="Chọn khung code hiển thị">
        {(["A", "B", "both"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${
              mobileTab === tab ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {tab === "both" ? "Cả hai" : `Bài ${tab}`}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`min-w-0 space-y-3 ${mobileTab === "B" ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="truncate text-sm font-semibold text-stone-900">A · {a.fileName} — {a.studentName} · {pctA}%</h2>
            <button onClick={() => copy("A")} className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900">
              {copied === "A" ? <FaCheck className="text-emerald-600" /> : <FaCopy />} {copied === "A" ? "Đã sao chép" : "Sao chép"}
            </button>
          </div>
          <CodeEditor code={codeA} onChange={setCodeA} scoredLines={scored.a} side="A" colorBlind={colorBlind} />
        </section>

        <section className={`min-w-0 space-y-3 ${mobileTab === "A" ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="truncate text-sm font-semibold text-stone-900">B · {b.fileName} — {b.studentName} · {pctB}%</h2>
            <button onClick={() => copy("B")} className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900">
              {copied === "B" ? <FaCheck className="text-emerald-600" /> : <FaCopy />} {copied === "B" ? "Đã sao chép" : "Sao chép"}
            </button>
          </div>
          <CodeEditor code={codeB} onChange={setCodeB} scoredLines={scored.b} side="B" colorBlind={colorBlind} />
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-4 border border-stone-200 bg-white p-4 text-xs text-stone-600" style={{ borderRadius: 10 }}>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5" style={{ background: "var(--cmp-a-strong)", borderRadius: 3 }} /> A · giống ≥90%
          {colorBlind && <span className="font-semibold">▬ nét liền</span>}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5" style={{ background: "var(--cmp-a-weak)", borderRadius: 3 }} /> A · giống ≥75%
          {colorBlind && <span className="font-semibold">┈ nét đứt</span>}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5" style={{ background: "var(--cmp-b-strong)", borderRadius: 3 }} /> B · giống ≥90%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5" style={{ background: "var(--cmp-b-weak)", borderRadius: 3 }} /> B · giống ≥75%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 border border-stone-200 bg-white" style={{ borderRadius: 3 }} /> Khác nhau — không tô
        </span>
        <span className="ml-auto text-stone-500">
          {colorBlind
            ? "Bật mù màu: phân đoạn bằng viền trái + nét liền/đứt, không chỉ phụ thuộc màu."
            : "Chỉ dòng trùng từ 75% token trở lên; dòng trống không tính và không tô."}
        </span>
      </div>

      {/* Bảng diff dạng chữ cho screen reader / người dùng không thấy màu */}
      <details className="border border-stone-200 bg-white p-4" style={{ borderRadius: 10 }}>
        <summary className="cursor-pointer text-sm font-semibold text-stone-900">Xem dạng bảng (cho trình đọc màn hình)</summary>
        <table className="mt-3 w-full border-collapse text-xs">
          <caption className="pb-2 text-left text-stone-600">Các đoạn giống nhau theo dòng (chỉ tính dòng ≥75%).</caption>
          <thead>
            <tr className="text-left text-stone-500">
              <th className="border border-stone-200 px-2 py-1">Bên A</th>
              <th className="border border-stone-200 px-2 py-1">Điểm</th>
              <th className="border border-stone-200 px-2 py-1">Bên B</th>
              <th className="border border-stone-200 px-2 py-1">Điểm</th>
            </tr>
          </thead>
          <tbody>
            {scored.a.map((l, i) => {
              const r = scored.b[Math.min(i, scored.b.length - 1)];
              if (!r) return null;
              const mA = !l.blank && l.score >= SIM_THRESHOLD;
              const mB = !r.blank && r.score >= SIM_THRESHOLD;
              if (!mA && !mB) return null;
              return (
                <tr key={i} className="align-top">
                  <td className="border border-stone-200 px-2 py-1 font-mono">{l.text.slice(0, 60) || "—"}</td>
                  <td className="border border-stone-200 px-2 py-1">{mA ? `${Math.round(l.score * 100)}%` : "—"}</td>
                  <td className="border border-stone-200 px-2 py-1 font-mono">{r.text.slice(0, 60) || "—"}</td>
                  <td className="border border-stone-200 px-2 py-1">{mB ? `${Math.round(r.score * 100)}%` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}
