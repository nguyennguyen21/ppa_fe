/**
 * Lớp API gọi thẳng các endpoint có sẵn của backend Spring Boot (module presentation).
 * Backend KHÔNG bị chỉnh sửa — FE chỉ gửi HTTP request đúng như backend đang cung cấp,
 * qua Vite dev-proxy "/api" → http://localhost:8080 (xem vite.config.ts).
 */

// ---------------------------------------------------------------------------
// Kiểu dữ liệu khớp với DTO phía backend (application/dto/response)
// ---------------------------------------------------------------------------

export interface SimilarityPairDto {
  snippetId1: number;
  snippetId2: number;
  studentName1: string | null;
  studentName2: string | null;
  overallSimilarity: number;
  winnowingSimilarity?: number;
  tfidfSimilarity?: number;
  structuralSimilarity?: number;
  severity?: string | null;
  matchingSegmentsCount?: number;
}

export interface SimilarityCalculationResponseDto {
  success: boolean;
  message: string;
  assignmentId: string;
  totalComparisons: number;
  plagiarismDetected: number;
  pairs: SimilarityPairDto[];
  executedAt: string;
}

export interface BatchUploadResultDto {
  codeId: number | null;
  fileName: string | null;
  studentName: string | null;
  status: string | null;
  message: string | null;
}

export interface BatchUploadResponseDto {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  results: BatchUploadResultDto[];
}

export interface TokenCloneDetectionResponseDto {
  success: boolean;
  message: string;
  assignmentId: string;
  executedAt: string;
}

// ---------------------------------------------------------------------------
// Job queue / SSE (backend: POST /api/v1/jobs/analysis, GET .../{jobId}/events)
// ---------------------------------------------------------------------------

export interface AnalysisJobRequestDto {
  assignmentId: string;
  type?: "SIMILARITY" | "TOKEN_CLONE" | "AST";
  threshold?: number;
}

export interface AnalysisJobResponseDto {
  jobId: string;
  assignmentId: string;
  type: string;
  status: string;
  attempts: number;
  threshold?: number | null;
  result?: unknown;
  errorMessage?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  terminal: boolean;
}

export interface ActorResponseDto {
  actorId: number;
  actorCode: string | null;
  actorType: string | null;
  description: string | null;
  isActive: boolean | null;
  codeId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AiHighlightLineDto {
  lineNumber: number;
  score: number;
  reason: string;
  lineText: string;
}

export interface AiHighlightResponseDto {
  codeId: number | null;
  overallPrediction: string | null;
  overallConfidence: number | null;
  heuristicScore: number | null;
  totalLines: number;
  suspiciousLineCount: number;
  suspiciousLines: AiHighlightLineDto[];
}

// ---------------------------------------------------------------------------
// Khung HTTP chung
// ---------------------------------------------------------------------------

async function readJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    throw new Error(`HTTP ${response.status} ${url}${detail ? ` — ${detail}` : ""}`);
  }
  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Các hàm gọi endpoint backend (giữ nguyên endpoint cũ, bổ sung batch highlight)
// ---------------------------------------------------------------------------

export const api = {
  /** GET /api/v1/actors — danh sách actor thật trong DB. */
  getActors: () =>
    readJson<ActorResponseDto[]>("/api/v1/actors"),

  /** GET /api/v1/similarity/results/{assignmentId} — snapshot tương đồng (backend tự tính khi cần). */
  getSimilarityResults: (assignmentId: string) =>
    readJson<SimilarityCalculationResponseDto>(
      `/api/v1/similarity/results/${encodeURIComponent(assignmentId)}`,
    ),

  /** POST /api/v1/similarity/calculate/{assignmentId} */
  calculateSimilarity: (assignmentId: string) =>
    readJson<SimilarityCalculationResponseDto>(
      `/api/v1/similarity/calculate/${encodeURIComponent(assignmentId)}`,
      { method: "POST" },
    ),

  /** POST /api/v1/plagiarism/assignments/{assignmentId}/detect-token-clones */
  detectTokenClones: (assignmentId: string) =>
    readJson<TokenCloneDetectionResponseDto>(
      `/api/v1/plagiarism/assignments/${encodeURIComponent(assignmentId)}/detect-token-clones`,
      { method: "POST" },
    ),

  /** POST /api/v1/snippets/upload — form-data, mỗi lượt một file. */
  uploadSnippet: (input: {
    fileName: string;
    blob: Blob;
    assignmentId: string;
    studentName?: string;
    submissionBatch?: string;
    language?: string;
    actorType?: string;
  }) => {
    const form = new FormData();
    form.append("files", input.blob, input.fileName);
    form.append("assignmentId", input.assignmentId);
    if (input.studentName) form.append("studentName", input.studentName);
    if (input.submissionBatch) form.append("submissionBatch", input.submissionBatch);
    if (input.language) form.append("language", input.language);
    if (input.actorType) form.append("actorType", input.actorType);
    return readJson<BatchUploadResponseDto>("/api/v1/snippets/upload", { method: "POST", body: form });
  },

  /** GET /api/v1/ai/snippets/{codeId}/highlight?threshold=0 — trả về mỗi dòng kèm nội dung thật. */
  highlightSnippet: (codeId: number | string, threshold = 0) =>
    readJson<AiHighlightResponseDto>(
      `/api/v1/ai/snippets/${encodeURIComponent(String(codeId))}/highlight?threshold=${threshold}`,
    ),

  /**
   * GET /api/v1/ai/highlights?codeIds=1,2,3&threshold=0.5 — batch highlight.
   * Một request cho tối đa 200 snippet thay vì N request riêng lẻ (giảm mạnh
   * số request/ngày và tránh nghẽn khi assignment nhiều file).
   */
  getHighlights: (codeIds: Array<number | string>, threshold = 0.5) => {
    const ids = codeIds.map((id) => String(id).trim()).filter((id) => id !== "");
    if (ids.length === 0) {
      return Promise.resolve<AiHighlightResponseDto[]>([]);
    }
    return readJson<AiHighlightResponseDto[]>(
      `/api/v1/ai/highlights?codeIds=${encodeURIComponent(ids.join(","))}&threshold=${threshold}`,
    );
  },

  /** POST /api/v1/ai/highlight — phân tích ad-hoc (code do người dùng dán/nạp). Body: { code, language, threshold }. */
  highlightAdHoc: (code: string, language: string, threshold = 0.5) =>
    readJson<AiHighlightResponseDto>("/api/v1/ai/highlight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, threshold }),
    }),

  /** POST /api/v1/jobs/analysis — đưa job phân tích vào hàng đợi, trả HTTP 202 + jobId. */
  submitAnalysisJob: (request: AnalysisJobRequestDto) =>
    readJson<AnalysisJobResponseDto>("/api/v1/jobs/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),

  /** GET /api/v1/jobs/analysis/{jobId} — trạng thái + kết quả (nếu xong). */
  getAnalysisJob: (jobId: string) =>
    readJson<AnalysisJobResponseDto>(`/api/v1/jobs/analysis/${encodeURIComponent(jobId)}`),

  /** GET /api/v1/jobs/analysis?limit= — danh sách job mới nhất. */
  listAnalysisJobs: (limit = 20) =>
    readJson<AnalysisJobResponseDto[]>(`/api/v1/jobs/analysis?limit=${limit}`),
};

/** Lấy lại nội dung code thật của một snippet từ backend. */

/**
 * Cache TTL cho nội dung snippet ở phía FE.
 *
 * <p>Mỗi lần mở một file, trước đây FE gọi lại highlight để lấy text, tốn một
 * request dù nội dung snippet không đổi. Cache ngắn hạn này loại bỏ các request
 * lặp lại đó (mở lại cùng file nhiều lần) mà không ảnh hưởng dữ liệu mới: sau
 * TTL, lần mở kế tiếp sẽ tải lại từ backend.</p>
 */
const SNIPPET_TEXT_TTL_MS = 5 * 60 * 1000;
const SNIPPET_TEXT_MAX_ENTRIES = 300;
const snippetTextCache = new Map<string, { value: string | null; expiresAt: number }>();

/** Text thật của một snippet: ghép từ highlight (threshold=0 → mọi dòng). */
export async function fetchSnippetText(codeId: number | string): Promise<string | null> {
  const key = String(codeId);
  const cached = snippetTextCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const text = await loadSnippetText(codeId);

  if (snippetTextCache.size >= SNIPPET_TEXT_MAX_ENTRIES) {
    const oldestKey = snippetTextCache.keys().next().value;
    if (oldestKey !== undefined) {
      snippetTextCache.delete(oldestKey);
    }
  }
  snippetTextCache.set(key, { value: text, expiresAt: Date.now() + SNIPPET_TEXT_TTL_MS });
  return text;
}

async function loadSnippetText(codeId: number | string): Promise<string | null> {
  const response = await api.highlightSnippet(codeId, 0);
  let total = Math.max(0, Math.floor(response.totalLines ?? 0));
  if (response.suspiciousLines) {
    const hasText = response.suspiciousLines.some((line) => line.lineText && line.lineText.trim() !== "");
    if (!hasText) {
      return null;
    }
    const buffer = new Array<string>(Math.max(total, 1)).fill("");
    for (const line of response.suspiciousLines) {
      const index = Math.max(0, Math.floor(line.lineNumber ?? 0) - 1);
      buffer[Math.min(index, buffer.length - 1)] = line.lineText ?? "";
    }
    return buffer.join("\n");
  }
  return null;
}

// ---------------------------------------------------------------------------
// Realtime: nghe trạng thái job qua SSE (không polling khi kết nối còn sống).
// ---------------------------------------------------------------------------

/** Mở kết nối SSE tới backend cho một job; trả về hàm huỷ. */
export function subscribeAnalysisJobEvents(
  jobId: string,
  handlers: {
    onEvent?: (job: AnalysisJobResponseDto) => void;
    onTerminal?: (job: AnalysisJobResponseDto) => void;
    onError?: (error: unknown) => void;
  } = {},
): () => void {
  const source = new EventSource(`/api/v1/jobs/analysis/${encodeURIComponent(jobId)}/events`);
  const listener = (event: MessageEvent) => {
    try {
      const job = JSON.parse(event.data) as AnalysisJobResponseDto;
      handlers.onEvent?.(job);
      if (job.terminal) {
        source.close();
        handlers.onTerminal?.(job);
      }
    } catch (error) {
      handlers.onError?.(error);
    }
  };
  source.addEventListener("job", listener as EventListener);
  source.onerror = (error) => {
    handlers.onError?.(error);
  };
  return () => source.close();
}

/**
 * Chờ job kết thúc bằng SSE; nếu SSE lỗi thì fallback polling nhẹ (2s/lần)
 * để không làm mất dữ liệu. Reject khi job FAILED.
 */
export function waitForAnalysisJob(
  jobId: string,
  onEvent?: (job: AnalysisJobResponseDto) => void,
): Promise<AnalysisJobResponseDto> {
  return new Promise<AnalysisJobResponseDto>((resolve, reject) => {
    let settled = false;
    let source: EventSource | null = null;
    let pollTimer: number | null = null;

    const finish = (job: AnalysisJobResponseDto) => {
      if (settled) return;
      settled = true;
      source?.close();
      if (pollTimer !== null) window.clearInterval(pollTimer);
      if (job.status === "FAILED") {
        reject(new Error(job.errorMessage || `Analysis job ${jobId} failed`));
      } else {
        resolve(job);
      }
    };

    source = new EventSource(`/api/v1/jobs/analysis/${encodeURIComponent(jobId)}/events`);
    source.addEventListener("job", ((event: MessageEvent) => {
      try {
        const job = JSON.parse(event.data) as AnalysisJobResponseDto;
        onEvent?.(job);
        if (job.terminal) finish(job);
      } catch {
        // Bỏ qua lỗi parse tạm thời.
      }
    }) as EventListener);

    source.onerror = () => {
      if (pollTimer !== null || settled) return;
      pollTimer = window.setInterval(() => {
        void (async () => {
          try {
            const job = await api.getAnalysisJob(jobId);
            onEvent?.(job);
            if (job.terminal) finish(job);
          } catch {
            // Thử lại ở chu kỳ sau.
          }
        })();
      }, 2000);
    };
  });
}
