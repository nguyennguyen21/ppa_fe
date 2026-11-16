/**
 * Lá»›p API gá»i tháº³ng cÃ¡c endpoint cÃ³ sáºµn cá»§a backend Spring Boot (module presentation).
 * Backend KHÃ”NG bá»‹ chá»‰nh sá»­a â€” FE chá»‰ gá»­i HTTP request Ä‘Ãºng nhÆ° backend Ä‘ang cung cáº¥p,
 * qua Vite dev-proxy "/api" â†’ http://localhost:8080 (xem vite.config.ts).
 */

// ---------------------------------------------------------------------------
// Kiá»ƒu dá»¯ liá»‡u khá»›p vá»›i DTO phÃ­a backend (application/dto/response)
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
    throw new Error(`HTTP ${response.status} ${url}${detail ? ` â€” ${detail}` : ""}`);
  }
  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// CÃ¡c hÃ m gá»i endpoint backend (giá»¯ nguyÃªn endpoint cÅ©, bá»• sung batch highlight)
// ---------------------------------------------------------------------------

export const api = {
  /** GET /api/v1/actors â€” danh sÃ¡ch actor tháº­t trong DB. */
  getActors: () =>
    readJson<ActorResponseDto[]>("/api/v1/actors"),

  /** GET /api/v1/similarity/results/{assignmentId} â€” snapshot tÆ°Æ¡ng Ä‘á»“ng (backend tá»± tÃ­nh khi cáº§n). */
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

  /** POST /api/v1/snippets/upload â€” form-data, má»—i lÆ°á»£t má»™t file. */
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

  /** GET /api/v1/ai/snippets/{codeId}/highlight?threshold=0 â€” tráº£ vá» má»—i dÃ²ng kÃ¨m ná»™i dung tháº­t. */
  highlightSnippet: (codeId: number | string, threshold = 0) =>
    readJson<AiHighlightResponseDto>(
      `/api/v1/ai/snippets/${encodeURIComponent(String(codeId))}/highlight?threshold=${threshold}`,
    ),

  /**
   * GET /api/v1/ai/highlights?codeIds=1,2,3&threshold=0.5 â€” batch highlight.
   * Má»™t request cho tá»‘i Ä‘a 200 snippet thay vÃ¬ N request riÃªng láº» (giáº£m máº¡nh
   * sá»‘ request/ngÃ y vÃ  trÃ¡nh ngháº½n khi assignment nhiá»u file).
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

  /** POST /api/v1/ai/highlight â€” phÃ¢n tÃ­ch ad-hoc (code do ngÆ°á»i dÃ¹ng dÃ¡n/náº¡p). Body: { code, language, threshold }. */
  highlightAdHoc: (code: string, language: string, threshold = 0.5) =>
    readJson<AiHighlightResponseDto>("/api/v1/ai/highlight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, threshold }),
    }),

  /** POST /api/v1/jobs/analysis â€” Ä‘Æ°a job phÃ¢n tÃ­ch vÃ o hÃ ng Ä‘á»£i, tráº£ HTTP 202 + jobId. */
  submitAnalysisJob: (request: AnalysisJobRequestDto) =>
    readJson<AnalysisJobResponseDto>("/api/v1/jobs/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),

  /** GET /api/v1/jobs/analysis/{jobId} â€” tráº¡ng thÃ¡i + káº¿t quáº£ (náº¿u xong). */
  getAnalysisJob: (jobId: string) =>
    readJson<AnalysisJobResponseDto>(`/api/v1/jobs/analysis/${encodeURIComponent(jobId)}`),

  /** GET /api/v1/jobs/analysis?limit= â€” danh sÃ¡ch job má»›i nháº¥t. */
  listAnalysisJobs: (limit = 20) =>
    readJson<AnalysisJobResponseDto[]>(`/api/v1/jobs/analysis?limit=${limit}`),
};

/** Láº¥y láº¡i ná»™i dung code tháº­t cá»§a má»™t snippet tá»« backend. */

/**
 * Cache TTL cho ná»™i dung snippet á»Ÿ phÃ­a FE.
 *
 * <p>Má»—i láº§n má»Ÿ má»™t file, trÆ°á»›c Ä‘Ã¢y FE gá»i láº¡i highlight Ä‘á»ƒ láº¥y text, tá»‘n má»™t
 * request dÃ¹ ná»™i dung snippet khÃ´ng Ä‘á»•i. Cache ngáº¯n háº¡n nÃ y loáº¡i bá» cÃ¡c request
 * láº·p láº¡i Ä‘Ã³ (má»Ÿ láº¡i cÃ¹ng file nhiá»u láº§n) mÃ  khÃ´ng áº£nh hÆ°á»Ÿng dá»¯ liá»‡u má»›i: sau
 * TTL, láº§n má»Ÿ káº¿ tiáº¿p sáº½ táº£i láº¡i tá»« backend.</p>
 */
const SNIPPET_TEXT_TTL_MS = 5 * 60 * 1000;
const SNIPPET_TEXT_MAX_ENTRIES = 300;
const snippetTextCache = new Map<string, { value: string | null; expiresAt: number }>();

/** Text tháº­t cá»§a má»™t snippet: ghÃ©p tá»« highlight (threshold=0 â†’ má»i dÃ²ng). */
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
// Realtime: nghe tráº¡ng thÃ¡i job qua SSE (khÃ´ng polling khi káº¿t ná»‘i cÃ²n sá»‘ng).
// ---------------------------------------------------------------------------

/** Má»Ÿ káº¿t ná»‘i SSE tá»›i backend cho má»™t job; tráº£ vá» hÃ m huá»·. */
export function subscribeAnalysisJobEvents(
  jobId: string,
  handlers: {
    onEvent?: (job: AnalysisJobResponseDto) => void;
    onTerminal?: (job: AnalysisJobResponseDto) => void;
    onError?: (error: unknown) => void;
  } = {},
): () => void {
  // Reconnect/backoff: EventSource tu dong mo lai, nhung ta van chu dong
  // backoff de tranh "bao hoa" request khi backend tam thoi loi.
  let source: EventSource | null = null;
  let reconnectTimer: number | null = null;
  let reconnectDelayMs = 1000;
  let terminalReceived = false;
  let closedByCaller = false;

  const clearReconnect = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const connect = () => {
    if (closedByCaller || terminalReceived) return;
    clearReconnect();
    source = new EventSource(`/api/v1/jobs/analysis/${encodeURIComponent(jobId)}/events`);

    const listener = (event: MessageEvent) => {
      try {
        const job = JSON.parse(event.data) as AnalysisJobResponseDto;
        handlers.onEvent?.(job);
        if (job.terminal) {
          terminalReceived = true;
          source?.close();
          source = null;
          handlers.onTerminal?.(job);
        }
      } catch (error) {
        handlers.onError?.(error);
      }
    };
    source.addEventListener("job", listener as EventListener);

    source.onopen = () => {
      // Ket noi thanh cong: reset backoff.
      reconnectDelayMs = 1000;
    };

    source.onerror = (error) => {
      handlers.onError?.(error);
      source?.close();
      source = null;
      if (closedByCaller || terminalReceived || reconnectTimer !== null) return;
      const delay = reconnectDelayMs;
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, 10000);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };
  };

  connect();

  return () => {
    closedByCaller = true;
    clearReconnect();
    source?.close();
    source = null;
  };
}

/**
 * Chá» job káº¿t thÃºc báº±ng SSE; náº¿u SSE lá»—i thÃ¬ fallback polling nháº¹ (2s/láº§n)
 * Ä‘á»ƒ khÃ´ng lÃ m máº¥t dá»¯ liá»‡u. Reject khi job FAILED.
 */
export function waitForAnalysisJob(
  jobId: string,
  onEvent?: (job: AnalysisJobResponseDto) => void,
): Promise<AnalysisJobResponseDto> {
  return new Promise<AnalysisJobResponseDto>((resolve, reject) => {
    let settled = false;
    let source: EventSource | null = null;
    let pollTimer: number | null = null;
    let pollDelayMs = 2000;

    const finish = (job: AnalysisJobResponseDto) => {
      if (settled) return;
      settled = true;
      source?.close();
      if (pollTimer !== null) window.clearTimeout(pollTimer);
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
        // Bá» qua lá»—i parse táº¡m thá»i.
      }
    }) as EventListener);

    const schedulePoll = () => {
      if (settled) return;
      pollTimer = window.setTimeout(() => {
        pollTimer = null;
        void (async () => {
          try {
            const job = await api.getAnalysisJob(jobId);
            onEvent?.(job);
            if (job.terminal) {
              finish(job);
              return;
            }
          } catch {
            // retry later
          }
          pollDelayMs = Math.min(pollDelayMs * 2, 10000);
          schedulePoll();
        })();
      }, pollDelayMs);
    };

    source.onerror = () => {
      if (pollTimer !== null || settled) return;
      schedulePoll();
    };
  });
}
