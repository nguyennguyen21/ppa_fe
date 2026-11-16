// Kiểu dữ liệu dùng chung cho các trang phân tích AI.
// Chỉ chứa TYPE — không chứa dữ liệu mẫu/mock.

export type SampleKind = "ai" | "human" | "mixed";

export interface LibrarySample {
  id: string;
  kind: SampleKind;
  fileName: string;
  title: string;
  description: string;
  author: string;
  className: string;
  uploadedAt: string;
  code: string;
}
