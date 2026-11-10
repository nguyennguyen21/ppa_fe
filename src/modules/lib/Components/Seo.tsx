import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMeta {
  title: string;
  description: string;
}

const DEFAULT_META: PageMeta = {
  title: "CODEX — Chống đạo văn học thuật",
  description:
    "CODEX giúp giảng viên phát hiện đạo văn mã nguồn, phân loại code do AI sinh, so sánh bài nộp và xuất báo cáo.",
};

const META: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Tổng quan đợt quét — CODEX",
    description:
      "Theo dõi số bài nộp, mức tương đồng cao nhất và các nhóm bài cần xem lại trước khi chấm.",
  },
  "/upload": {
    title: "Nạp bài nộp — CODEX",
    description:
      "Tải lên file, thư mục hoặc zip để chạy một đợt quét đạo văn. Hệ thống tách zip và hiển thị từng file.",
  },
  "/results": {
    title: "Kết quả quét đạo văn — CODEX",
    description:
      "Lọc, tìm kiếm và so sánh các bài nộp theo mức tương đồng, trạng thái và thông tin sinh viên.",
  },
  "/compare": {
    title: "So sánh hai đoạn code — CODEX",
    description:
      "Đối chiếu trực tiếp hai bài nộp ở mức dòng, xem đoạn giống nhau và tỉ lệ tương đồng.",
  },
  "/relations": {
    title: "Biểu đồ quan hệ bài nộp — CODEX",
    description:
      "Trực quan hoá các cặp bài tương đồng, cụm liên kết và mức độ liên hệ giữa các bài nộp.",
  },
  "/ai-detect": {
    title: "Phân loại code AI — CODEX",
    description:
      "Phân tích 34 chỉ số tĩnh để ước lượng khả năng mã nguồn do AI sinh hoặc do người viết.",
  },
  "/ai-detect/kho-mau": {
    title: "Kho mẫu mã nguồn — CODEX",
    description: "Thư viện mẫu code AI, người viết và hỗn hợp dùng để thử nghiệm phân loại.",
  },
  "/ai-detect/cum": {
    title: "Mô hình cụm — CODEX",
    description: "Xem các bài mẫu được gom cụm theo đặc trưng chỉ số và trực quan hoá PCA.",
  },
  "/ai-detect/analyze": {
    title: "Phân tích mã nguồn — CODEX",
    description:
      "Dán hoặc nạp mã nguồn để xem kết quả phân loại AI/người viết, tín hiệu nổi bật và 34 chỉ số.",
  },
  "/profile": {
    title: "Hồ sơ giảng viên — CODEX",
    description: "Quản lý thông tin giảng viên và lịch sử quét bài nộp.",
  },
};

export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = META[pathname] ?? DEFAULT_META;
    document.title = meta.title;

    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = meta.description;

    let ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = meta.title;

    let ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.content = meta.description;
  }, [pathname]);

  return null;
}
