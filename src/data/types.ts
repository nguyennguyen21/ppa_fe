// Kiểu dữ liệu dùng chung cho dữ liệu THẬT đọc từ backend (không còn mock data).

export interface Submission {
  id: string;
  fileName: string;
  studentCode: string;
  studentName: string;
  className: string;
  language: string;
  label: "plagiarism" | "innocent" | "suspicious";
  similarity: number;
  size: string;
  uploadedAt: string;
  status: "done" | "processing" | "pending";
}

export interface PairRelation {
  id: string;
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  aStudent: string;
  bStudent: string;
  similarity: number;
}
