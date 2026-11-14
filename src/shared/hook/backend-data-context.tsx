/* eslint-disable react-refresh/only-export-components */
/**
 * Nguồn dữ liệu THẬT từ backend Spring Boot.
 *
 * - Backend: giữ nguyên các endpoint cũ và BỔ SUNG endpoint batch/cache/job
 *   (ví dụ /api/v1/ai/highlights, /api/v1/actors/page, /api/v1/jobs/analysis).
 *   Các endpoint cũ (/api/v1/similarity/results, /api/v1/snippets/upload,
 *   /api/v1/plagiarism, /api/v1/actors…) vẫn dùng bình thường.
 * - Dữ liệu mock bị XÓA (src/data/mock.ts / pairRelations.ts): các trang lấy
 *   Submission, PairRelation, hoạt động gần đây… từ response thật của backend.
 * - Giao diện UI của các trang giữ nguyên 100%, chỉ đổi nguồn dữ liệu.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Submission } from "../../data/types";
import type { PairRelation } from "../../data/types";
import {
  api,
  fetchSnippetText,
  waitForAnalysisJob,
  type ActorResponseDto,
  type AiHighlightResponseDto,
  type BatchUploadResultDto,
  type SimilarityCalculationResponseDto,
} from "../../lib/api";

// ---------------------------------------------------------------------------
// Kiểu dữ liệu
// ---------------------------------------------------------------------------

export interface RecentActivityItem {
  id: number;
  text: string;
  time: string;
  level: "high" | "warn" | "ok";
}

export type BackendStatus = "connecting" | "ready" | "empty" | "error";

export interface UploadItem {
  /** Tên file thật được gửi lên backend. */
  name: string;
  /** Nội dung thật của file (đã đọc sẵn bởi UploadDropzone). */
  text?: string;
}

export interface ScanOutcome {
  canceled: boolean;
  assignmentId: string;
  /** Kết quả upload từng file (codeId thật do backend trả về). */
  results: BatchUploadResultDto[];
}

export interface ClusterSummary {
  id: string;
  count: number;
}

interface CatalogEntry {
  fileName?: string;
  studentName?: string;
  sizeKB?: number;
  uploadedAt?: string;
}

type Catalog = Record<string, CatalogEntry>;

/** Kết quả phân tích AI (AI tạo / người viết / trung gian) từ backend cho một snippet. */
export interface AiFileResult {
  codeId: number;
  fileName: string;
  /** "ai" | "human" | "trung gian" (kể cả unknown). */
  prediction: string;
  confidence: number;
  heuristicScore: number | null;
  suspiciousLineCount: number;
  totalLines: number;
}

interface BackendDataValue {
  status: BackendStatus;
  /** Assignment đang được dùng cho toàn bộ trang tổng quan/kết quả. */
  assignmentId: string | null;
  /** Danh sách bài nộp thật (object khớp interface Submission của UI). */
  submissions: Submission[];
  /** Các cặp tương đồng thật (object khớp interface PairRelation của UI). */
  pairs: PairRelation[];
  /** Hoạt động gần đây suy ra từ dữ liệu thật. */
  activity: RecentActivityItem[];
  /** Số sinh viên thật xuất hiện trong dữ liệu. */
  studentCount: number;
  /** Số cụm liên kết suy ra từ cặp tương đồng thật. */
  clusters: ClusterSummary[];
  /** Kết quả phân tích AI cho từng snippet đã quét (dùng cho trang thống kê / kho mẫu AI). */
  aiResults: AiFileResult[];
  /** Đang nạp kết quả phân tích AI từ backend (hiện tại có thể đang tính). */
  aiLoading: boolean;
  error: string | null;
  setAssignment: (assignmentId: string) => void;
  reload: () => void;
  /** Lấy nội dung code thật của một snippet từ backend. */
  getSnippetCode: (codeId: string | number) => Promise<string | null>;
  /**
   * Đẩy file thật lên backend, chạy phát hiện token-clone và tính tương đồng thật,
   * sau đó làm mới toàn bộ dữ liệu. `shouldContinue` để huỷ giữa chừng (nút Huỷ quét).
   */
  uploadAndScan: (
    items: UploadItem[],
    language: string,
    options: {
      onProgress?: (done: number, total: number) => void;
      shouldContinue?: () => boolean;
    },
  ) => Promise<ScanOutcome>;
}

// ---------------------------------------------------------------------------
// localStorage helpers (lưu assignment đang dùng + catalog tên file thật)
// ---------------------------------------------------------------------------

const LS_ASSIGNMENT_KEY = "ppa.assignmentId.v1";
const LS_CATALOG_KEY = "ppa.catalog.v1";
const LS_CANDIDATES_KEY = "ppa.candidates.v1";
const ASSIGNMENT_PREFIX = "ASSIGNMENT_";
const ASSIGNMENT_FALLBACK = "ASSIGNMENT_001";

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage có thể bị chặn — bỏ qua.
  }
}

function readCatalog(): Catalog {
  return readStored<Catalog>(LS_CATALOG_KEY, {});
}

function readRecentAssignments(): string[] {
  return readStored<string[]>(LS_CANDIDATES_KEY, []);
}

// ---------------------------------------------------------------------------
// Map phụ trợ (không thay đổi logic UI của các trang)
// ---------------------------------------------------------------------------

/** Nhãn hiển thị trên UI (đẹp, có khoảng trắng). */
const EXT_LANGUAGE: Record<string, string> = {
  c: "C",
  h: "C",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  hpp: "C++",
  py: "Python",
  java: "Java",
  js: "JavaScript",
  ts: "TypeScript",
};

/**
 * Mã ngôn ngữ gửi lên backend — PHẢI khớp `language.language_code` trong DB
 * (c, cpp, csharp, go, java, javascript, kotlin, php, python, ruby, rust,
 * scala, swift, typescript). Gửi sai mã sẽ vi phạm FK `fk_snippet_language`
 * khi backend insert vào `code_snippets`.
 */
const EXT_LANGUAGE_CODE: Record<string, string> = {
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  py: "python",
  java: "java",
  js: "javascript",
  ts: "typescript",
  cs: "csharp",
  go: "go",
  rs: "rust",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  scala: "scala",
};

const languageCodeFromFileName = (fileName: string) => {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? (EXT_LANGUAGE_CODE[match[1]!.toLowerCase()] ?? "") : "";
};

export const languageFromFileName = (fileName: string) => {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? (EXT_LANGUAGE[match[1]!.toLowerCase()] ?? "") : "";
};

/** severity thật từ backend → nhãn UI (thang của backend: CRITICAL/HIGH/MEDIUM/LOW/NONE). */
const severityToLabel = (severity: string | null | undefined, similarityPct: number) => {
  if (severity) {
    const value = severity.toUpperCase();
    if (value === "CRITICAL" || value === "HIGH") return "plagiarism" as const;
    if (value === "MEDIUM") return "suspicious" as const;
    if (value === "LOW" || value === "NONE") return "innocent" as const;
  }
  if (similarityPct >= 75) return "plagiarism" as const;
  if (similarityPct >= 60) return "suspicious" as const;
  return "innocent" as const;
};

const relativeTimeLabel = (iso: string | null | undefined) => {
  if (!iso) return "";
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "";
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

interface SnippetStatusEntry {
  similarity: number;
  severityRank: number;
  studentName: string;
}

const SEVERITY_RANK: Record<string, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

// ---------------------------------------------------------------------------
// Xây dữ liệu cho UI từ snapshot thật của backend
// ---------------------------------------------------------------------------

function buildPagesData(
  snapshot: SimilarityCalculationResponseDto,
  actors: ActorResponseDto[],
  catalog: Catalog,
) {
  // --- 1. Actor thật trong DB (liên kết codeId) -----------------------------
  const actorByCodeId = new Map<number, ActorResponseDto>();
  for (const actor of actors) {
    if (actor.codeId != null) actorByCodeId.set(actor.codeId, actor);
  }

  // --- 2. Gom cặp tương đồng thật ------------------------------------------
  const seenPair = new Set<string>();
  const collected: Array<{ pair: PairRelation; aId: number; bId: number; similarity: number; severity: string }> = [];

  for (const dto of snapshot.pairs ?? []) {
    const aId = Math.floor(toNumber(dto.snippetId1));
    const bId = Math.floor(toNumber(dto.snippetId2));
    if (aId <= 0 || bId <= 0) continue;
    const key = `${aId}-${bId}`;
    if (seenPair.has(key) || seenPair.has(`${bId}-${aId}`)) continue;
    seenPair.add(key);

    const similarityPct = Math.round(toNumber(dto.overallSimilarity) * 100);
    const pair: PairRelation = {
      id: `${aId}-${bId}`,
      aId: String(aId),
      bId: String(bId),
      aName: catalog[String(aId)]?.fileName ?? actorByCodeId.get(aId)?.actorCode ?? `#${aId}`,
      bName: catalog[String(bId)]?.fileName ?? actorByCodeId.get(bId)?.actorCode ?? `#${bId}`,
      aStudent: dto.studentName1 ?? catalog[String(aId)]?.studentName ?? "",
      bStudent: dto.studentName2 ?? catalog[String(bId)]?.studentName ?? "",
      similarity: similarityPct,
    };
    collected.push({ pair, aId, bId, similarity: similarityPct, severity: dto.severity ?? "" });
  }

  const pairRelations = collected
    .map((item) => item.pair)
    .sort((x, y) => y.similarity - x.similarity);

  // --- 3. Gom Submission thật theo từng bài nộp ----------------------------
  const statusById = new Map<number, SnippetStatusEntry>();
  for (const item of collected) {
    const firstRank = SEVERITY_RANK[item.severity.toUpperCase()] ?? 0;
    for (const [id, studentName] of [
      [item.aId, item.pair.aStudent],
      [item.bId, item.pair.bStudent],
    ] as const) {
      const entry = statusById.get(id);
      const candidate: SnippetStatusEntry = {
        similarity: item.similarity,
        severityRank: firstRank,
        studentName: studentName ?? "",
      };
      if (!entry) {
        statusById.set(id, candidate);
      } else {
        statusById.set(id, {
          similarity: Math.max(entry.similarity, candidate.similarity),
          severityRank: Math.max(entry.severityRank, candidate.severityRank),
          studentName: entry.studentName || candidate.studentName,
        });
      }
    }
  }

  const submissions: Submission[] = [...statusById.entries()]
    .map(([codeId, entry]) => {
      const fileName =
        catalog[String(codeId)]?.fileName ?? actorByCodeId.get(codeId)?.actorCode ?? `#${codeId}`;
      const severityName = // dùng rank giàu nhất để map về nhãn UI
        entry.severityRank >= 3
          ? "HIGH"
          : entry.severityRank === 2
            ? "MEDIUM"
            : entry.severityRank === 1
              ? "LOW"
              : "NONE";
      return {
        id: String(codeId),
        fileName,
        studentCode: actorByCodeId.get(codeId)?.actorCode ?? "",
        studentName: entry.studentName || catalog[String(codeId)]?.studentName || "",
        className: "",
        language: languageFromFileName(fileName),
        label: severityToLabel(severityName, entry.similarity),
        similarity: entry.similarity,
        size: catalog[String(codeId)]?.sizeKB ? `${catalog[String(codeId)]!.sizeKB} KB` : "",
        uploadedAt: catalog[String(codeId)]?.uploadedAt ?? "",
        status: "done" as const,
      };
    })
    .sort((x, y) => y.similarity - x.similarity);

  // --- 4. Hoạt động gần đây suy ra từ kết quả thật --------------------------
  const activity: RecentActivityItem[] = pairRelations.slice(0, 3).map((pair, index) => ({
    id: index + 1,
    text: `Bài ${pair.aName} và ${pair.bName} được đánh dấu tương đồng ${pair.similarity}%`,
    time: relativeTimeLabel(snapshot.executedAt) || "gần đây",
    level: (pair.similarity >= 80 ? "high" : pair.similarity >= 60 ? "warn" : "ok") as RecentActivityItem["level"],
  }));
  activity.push({
    id: 4,
    text: `Hoàn tất quét ${submissions.length} bài nộp — ${snapshot.totalComparisons} so sánh`,
    time: relativeTimeLabel(snapshot.executedAt) || "gần đây",
    level: "ok",
  });

  // --- 5. Cụm liên kết (union-find trên các cặp thật ≥ 60%) -----------------
  const parent = new Map<number, number>();
  const findRoot = (x: number): number => {
    const p = parent.get(x) ?? x;
    return p === x ? x : (parent.set(x, findRoot(p)), findRoot(p));
  };
  for (const item of collected) {
    if (item.similarity < 60) continue;
    const rootA = findRoot(item.aId);
    const rootB = findRoot(item.bId);
    if (rootA !== rootB) parent.set(rootA, rootB);
  }
  const grouped = new Map<number, Set<number>>();
  for (const item of collected) {
    if (item.similarity < 60) continue;
    const root = findRoot(item.aId);
    const bucket = grouped.get(root) ?? new Set<number>();
    bucket.add(item.aId);
    bucket.add(item.bId);
    grouped.set(root, bucket);
  }
  const clusters: ClusterSummary[] = [...grouped.values()]
    .map((members) => members.size)
    .sort((x, y) => y - x)
    .slice(0, 6)
    .map((count, index) => ({ id: String(index + 1), count }));

  const studentCount = new Set(
    [...statusById.values()].map((entry) => entry.studentName).filter((name) => name.trim() !== ""),
  ).size;

  return { submissions, pairRelations, activity, studentCount, clusters };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const BackendDataContext = createContext<BackendDataValue | undefined>(undefined);

export function BackendDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>("connecting");
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pairRelations, setPairRelations] = useState<PairRelation[]>([]);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [aiResults, setAiResults] = useState<AiFileResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const catalogRef = useRef<Catalog>(readCatalog());
  const aiCacheRef = useRef<Map<number, AiFileResult | null>>(new Map());

  const applySnapshot = useCallback(
    (snapshot: SimilarityCalculationResponseDto, actors: ActorResponseDto[], usedAssignment: string) => {
      const data = buildPagesData(snapshot, actors, catalogRef.current);
      setSubmissions(data.submissions);
      setPairRelations(data.pairRelations);
      setActivity(data.activity);
      setClusters(data.clusters);
      setStudentCount(data.studentCount);
      setAssignmentId(usedAssignment);
      setStatus("ready");
      setError(null);
      writeStored(LS_ASSIGNMENT_KEY, usedAssignment);
      const others = readRecentAssignments().filter((id) => id !== usedAssignment);
      writeStored(LS_CANDIDATES_KEY, [usedAssignment, ...others].slice(0, 6));
    },
    [],
  );

  const loadFor = useCallback(
    async (requested: string | null) => {
      const url = new URL(window.location.href);
      const queryAssignment = url.searchParams.get("assignment");
      const stored = readStored<string | null>(LS_ASSIGNMENT_KEY, null);
      const recents = readRecentAssignments();

      const candidates = [requested, queryAssignment, stored, ...recents, ASSIGNMENT_FALLBACK]
        .filter((value): value is string => typeof value === "string" && value.trim() !== "");
      const unique = [...new Set(candidates)];

      let lastError: string | null = null;
      for (const candidate of unique) {
        try {
          const snapshot = await api.getSimilarityResults(candidate);
          if (snapshot?.success && (snapshot.pairs?.length ?? 0) > 0) {
            let actors: ActorResponseDto[] = [];
            try {
              actors = await api.getActors();
            } catch {
              actors = [];
            }
            applySnapshot(snapshot, actors, candidate);
            return;
          }
        } catch (exception) {
          lastError = exception instanceof Error ? exception.message : String(exception);
        }
      }

      // Không có dữ liệu thật cho assignment nào — các trang render trạng thái rỗng.
      setSubmissions([]);
      setPairRelations([]);
      setActivity([]);
      setClusters([]);
      setStudentCount(0);
      setAssignmentId(requested ?? stored ?? null);
      setError(lastError);
      setStatus(lastError ? "error" : "empty");
    },
    [applySnapshot],
  );

  useEffect(() => {
    void loadFor(null);
  }, [loadFor]);

  const reload = useCallback(() => {
    void loadFor(assignmentId);
  }, [assignmentId, loadFor]);

  // Nạp kết quả phân tích AI (GET /api/v1/ai/snippets/{codeId}/highlight) cho
  // các snippet trong assignment đang dùng. Chỉ chạy khi provider đã có dữ liệu.
  useEffect(() => {
    if (status !== "ready" || assignmentId == null) {
      return;
    }
    const codeIds = new Set<number>();
    const fileNames = new Map<number, string>();
    for (const submission of submissions) {
      const codeId = Number(submission.id);
      if (!Number.isFinite(codeId) || codeId <= 0) continue;
      codeIds.add(codeId);
      fileNames.set(codeId, submission.fileName);
    }
    if (codeIds.size === 0) {
      setAiResults([]);
      return;
    }
    let cancelled = false;
    setAiLoading(true);
    void (async () => {
      const entries = Array.from(codeIds);
      const missing = entries.filter((codeId) => aiCacheRef.current.get(codeId) == null);

      // Batch trước: gom tối đa 200 snippet vào MỘT request thay vì N request
      // riêng lẻ. Đây là thay đổi thực sự làm giảm số request/ngày của FE.
      const batchHighlights = new Map<number, AiHighlightResponseDto>();
      if (missing.length > 0) {
        const chunks: number[][] = [];
        for (let i = 0; i < missing.length; i += 200) {
          chunks.push(missing.slice(i, i + 200));
        }
        try {
          const responses = await Promise.all(
            chunks.map((chunk) => api.getHighlights(chunk, 0.5)),
          );
          for (const response of responses) {
            for (const item of response) {
              if (item?.codeId != null) {
                batchHighlights.set(Number(item.codeId), item);
              }
            }
          }
        } catch {
          // Batch lỗi (ví dụ backend cũ chưa có endpoint): bỏ qua để vòng lặp
          // từng snippet bên dưới chạy như hành vi cũ.
        }
      }

      const settled = await Promise.all(
        entries.map(async (codeId) => {
          let cached = aiCacheRef.current.get(codeId);
          if (cached == null) {
            cached = null;
            // Fallback: id không có trong batch (snippet lỗi/không tồn tại)
            // vẫn gọi riêng để giữ nguyên hành vi cũ.
            const batchItem = batchHighlights.get(codeId);
            try {
              const highlight = batchItem ?? (await api.highlightSnippet(codeId, 0.5));
              if (highlight) {
                cached = {
                  codeId,
                  fileName: fileNames.get(codeId) ?? `#${codeId}`,
                  prediction: highlight.overallPrediction ?? "unknown",
                  confidence: highlight.overallConfidence ?? 0,
                  heuristicScore: highlight.heuristicScore ?? null,
                  suspiciousLineCount: highlight.suspiciousLineCount ?? 0,
                  totalLines: highlight.totalLines ?? 0,
                };
              }
            } catch {
              cached = null;
            }
            aiCacheRef.current.set(codeId, cached);
          }
          return cached;
        }),
      );
      if (!cancelled) {
        // Ghép kết quả về đúng thứ tự codeId ban đầu (index-based) để thứ tự
        // hiển thị không phụ thuộc vào thời điểm từng request hoàn tất và
        // không phụ thuộc vào hành vi ngầm của Promise.all. Filter null vẫn
        // giữ nguyên logic cũ: snippet fetch lỗi thì bị loại khỏi danh sách.
        setAiResults(
          entries
            .map((_codeId, index) => settled[index])
            .filter((item): item is AiFileResult => item != null),
        );
        setAiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, assignmentId, submissions]);

  const setAssignment = useCallback(
    (next: string) => {
      void loadFor(next);
    },
    [loadFor],
  );

  const getSnippetCode = useCallback((codeId: string | number) => {
    return fetchSnippetText(codeId);
  }, []);

  const uploadAndScan = useCallback<BackendDataValue["uploadAndScan"]>(
    async (items, language, options) => {
      const { onProgress, shouldContinue } = options;
      const assignmentIdNow = `${ASSIGNMENT_PREFIX}${Date.now()}`;
      const catalogUpdate: Catalog = {};
      const results: BatchUploadResultDto[] = [];

      let shouldAbort = false;
      for (let index = 0; index < items.length; index += 1) {
        if (shouldContinue?.() === false) {
          shouldAbort = true;
          break;
        }
        const item = items[index]!;
        const content = item.text ?? "";
        const blob = new Blob([content], { type: "text/plain" });
        // Mỗi file là của một sinh viên: dùng tên file (bỏ phần mở rộng) làm tên sinh viên thật.
        const studentName = item.name.replace(/\.[^.]+$/, "");
        try {
          const response = await api.uploadSnippet({
            fileName: item.name,
            blob,
            assignmentId: assignmentIdNow,
            studentName: studentName || undefined,
            submissionBatch: assignmentIdNow,
            // Gửi mã ngôn ngữ KHỚP language_code trong DB (c, cpp, python…)
            // để không vi phạm FK `fk_snippet_language`; nếu không map được thì
            // để backend tự phát hiện theo phần mở rộng/nội dung.
            language: languageCodeFromFileName(item.name) || language || undefined,
            actorType: "STUDENT",
          });
          const uploaded = response.results?.[0];
          const codeId = uploaded?.codeId != null ? uploaded.codeId : null;
          results.push(
            uploaded ?? {
              codeId: null,
              fileName: item.name,
              studentName,
              status: "failed",
              message: "Không nhận được kết quả từ backend",
            },
          );
          if (codeId != null) {
            catalogUpdate[String(codeId)] = {
              fileName: item.name,
              studentName,
              sizeKB: Math.round(blob.size / 1024),
              uploadedAt: new Date().toISOString().slice(0, 10),
            };
          }
        } catch (exception) {
          // File này upload lỗi vẫn tiếp tục các file còn lại (không hỏng cả đợt quét).
          results.push({
            codeId: null,
            fileName: item.name,
            studentName,
            status: "failed",
            message: exception instanceof Error ? exception.message : String(exception),
          });
        }
        onProgress?.(index + 1, items.length);
      }

      if (!shouldAbort && results.length > 0) {
        // Phát hiện clone qua hàng đợi + SSE (không giữ HTTP connection trong
        // lúc backend xử lý). Lỗi được bỏ qua để vẫn tiếp tục tính tương đồng.
        if (shouldContinue?.() !== false) {
          try {
            const cloneJob = await api.submitAnalysisJob({
              assignmentId: assignmentIdNow,
              type: "TOKEN_CLONE",
            });
            await waitForAnalysisJob(cloneJob.jobId);
          } catch {
            // Vẫn tiếp tục tính tương đồng dù phát hiện clone bị lỗi.
          }
        }

        // Tính tương đồng qua hàng đợi + SSE; kết quả job (nếu có) dùng luôn
        // để cập nhật UI ngay khi backend báo COMPLETED (thời gian thực).
        let similarityResult: SimilarityCalculationResponseDto | null = null;
        if (shouldContinue?.() !== false) {
          try {
            const similarityJob = await api.submitAnalysisJob({
              assignmentId: assignmentIdNow,
              type: "SIMILARITY",
            });
            const completed = await waitForAnalysisJob(similarityJob.jobId);
            if (completed.result && typeof completed.result === "object") {
              similarityResult = completed.result as SimilarityCalculationResponseDto;
            }
          } catch {
            // Bỏ qua — người dùng có thể Để loadFor thử lại khi trang tải lại.
          }
        }

        const mergedCatalog = { ...readCatalog(), ...catalogUpdate };
        catalogRef.current = mergedCatalog;
        writeStored(LS_CATALOG_KEY, mergedCatalog);

        try {
          let snapshot: SimilarityCalculationResponseDto;
          if (similarityResult) {
            snapshot = similarityResult;
          } else {
            snapshot = await api.getSimilarityResults(assignmentIdNow);
          }
          let actors: ActorResponseDto[] = [];
          try {
            actors = await api.getActors();
          } catch {
            actors = [];
          }
          applySnapshot(snapshot, actors, assignmentIdNow);
        } catch {
          // Không lấy được snapshot ngay sau quét — vẫn giữ kết quả upload đã lưu.
        }
      }

      return { canceled: shouldAbort, assignmentId: assignmentIdNow, results };
    },
    [applySnapshot],
  );

  const value = useMemo<BackendDataValue>(
    () => ({
      status,
      assignmentId,
      submissions,
      pairs: pairRelations,
      activity,
      studentCount,
      clusters,
      aiResults,
      aiLoading,
      error,
      setAssignment,
      reload,
      getSnippetCode,
      uploadAndScan,
    }),
    [
      status,
      assignmentId,
      submissions,
      pairRelations,
      activity,
      studentCount,
      clusters,
      aiResults,
      aiLoading,
      error,
      setAssignment,
      reload,
      getSnippetCode,
      uploadAndScan,
    ],
  );

  return <BackendDataContext.Provider value={value}>{children}</BackendDataContext.Provider>;
}

export function useBackendData() {
  const context = useContext(BackendDataContext);
  if (!context) throw new Error("useBackendData must be used within a BackendDataProvider");
  return context;
}
