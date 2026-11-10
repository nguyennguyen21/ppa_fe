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
// Các hàm gọi đúng endpoint backend đang có sẵn (không thêm endpoint mới)
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

  /** POST /api/v1/ai/highlight — phân tích ad-hoc (code do người dùng dán/nạp). Body: { code, language, threshold }. */
  highlightAdHoc: (code: string, language: string, threshold = 0.5) =>
    readJson<AiHighlightResponseDto>("/api/v1/ai/highlight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, threshold }),
    }),
};

/** Lấy lại nội dung code thật của một snippet từ backend. */

/** Text thật của một snippet: ghép từ highlight (threshold=0 → mọi dòng). */
export async function fetchSnippetText(codeId: number | string): Promise<string | null> {
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
