/* eslint-disable react-refresh/only-export-components */
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
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { FaGear, FaLightbulb, FaXmark } from "react-icons/fa6";

interface GuideContent {
  title: string;
  body: string;
}

const GUIDES: Record<string, GuideContent> = {
  "upload-continue": {
    title: "Bước tiếp theo",
    body: "Sau khi đã chọn file, bấm Tiếp tục để chọn ngôn ngữ, ngưỡng cảnh báo và tuỳ chọn chuẩn hoá trước khi quét.",
  },
  "upload-start": {
    title: "Bắt đầu quét",
    body: "Hệ thống đọc từng file, tiến trình và thời gian còn lại được tính theo số file thực tế. Bạn có thể huỷ giữa chừng.",
  },
  "upload-cancel": {
    title: "Huỷ quét",
    body: "Dừng đợt quét hiện tại và quay lại bước cấu hình. Các file đã chọn vẫn được giữ nguyên.",
  },
  "upload-clear": {
    title: "Xoá danh sách",
    body: "Xoá toàn bộ file đang chờ. Hệ thống sẽ hỏi xác nhận trước khi xoá để tránh mất dữ liệu.",
  },
  "upload-preview": {
    title: "Xem trước file",
    body: "Mở nhanh nội dung file ngay trong trình duyệt trước khi quét. Với file zip, nội dung từng file bên trong cũng được đọc sẵn.",
  },
  "results-filter": {
    title: "Lọc theo trạng thái",
    body: "Các chip lọc giúp thu hẹp danh sách: cần xem lại, nghi ngờ hoặc không có dấu hiệu. Số lượng trên chip cập nhật theo dữ liệu hiện có.",
  },
  "results-select": {
    title: "Chọn bài để so sánh",
    body: "Tích vào ô chọn ở mỗi bài. Chọn đúng 2 bài rồi bấm So sánh để mở trang đối chiếu song song.",
  },
  "results-compare": {
    title: "So sánh 2 bài đã chọn",
    body: "Nút này chỉ bật khi bạn đã chọn đủ 2 bài. Hệ thống sẽ mở trang so sánh và tự nạp đúng hai bài nộp.",
  },
  "detect-sample": {
    title: "Mẫu phân tích",
    body: "Chọn nhanh một mẫu AI, người viết hoặc hỗn hợp để xem cách hệ thống chấm 34 chỉ số. Bạn vẫn có thể dán code của mình.",
  },
  "detect-edit": {
    title: "Sửa mã nguồn",
    body: "Bật chế độ sửa để dùng editor có tô màu cú pháp, gấp code, tìm kiếm và ghép ngoặc. Kết quả phân loại cập nhật ngay khi gõ.",
  },
  "detect-clear": {
    title: "Xoá nội dung",
    body: "Xoá đoạn code hiện tại để bắt đầu lại. Thao tác này sẽ hỏi xác nhận vì không thể hoàn tác.",
  },
  "detect-metrics": {
    title: "Hồ sơ chỉ số",
    body: "Mỗi nhóm chỉ số có thể thu gọn để dễ đọc. Bấm biểu tượng ⓘ cạnh tên chỉ số để xem giải thích chi tiết.",
  },
  "relations-zoom": {
    title: "Thu phóng biểu đồ",
    body: "Dùng nút + / − hoặc lăn chuột để phóng to, thu nhỏ. Kéo vùng trống để di chuyển toàn bộ biểu đồ.",
  },
  "relations-fit": {
    title: "Vừa khung",
    body: "Tự căn lại biểu đồ để toàn bộ node và cạnh đều nằm trong khung nhìn.",
  },
  "relations-reset": {
    title: "Đặt lại bố cục",
    body: "Đưa các node về vị trí ban đầu sau khi bạn đã kéo sắp xếp.",
  },
  "dashboard-export": {
    title: "Xuất báo cáo",
    body: "Excel tải file .xlsx nhiều sheet; PDF mở bản in để bạn chọn Lưu thành PDF. Nếu popup bị chặn, hãy cho phép popup của trang.",
  },
  "settings-theme": {
    title: "Cài đặt & hướng dẫn",
    body: "Mở bảng cài đặt để chọn giao diện sáng/tối/theo hệ thống, bật tắt hướng dẫn khi bấm nút và xem lại các hướng dẫn đã xem.",
  },
};

interface GuidanceSettings {
  enabled: boolean;
  seen: string[];
}

const STORAGE_KEY = "codex.guidance.v1";

interface GuidanceContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  resetSeen: () => void;
  seenCount: number;
}

const GuidanceContext = createContext<GuidanceContextValue | undefined>(undefined);

const readSettings = (): GuidanceSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GuidanceSettings>;
      return {
        enabled: parsed.enabled !== false,
        seen: Array.isArray(parsed.seen) ? parsed.seen.filter((key) => typeof key === "string") : [],
      };
    }
  } catch {
    // Dùng mặc định nếu dữ liệu hỏng.
  }
  return { enabled: true, seen: [] };
};

interface CardState {
  key: string;
  content: GuideContent;
  left: number;
  top?: number;
  bottom?: number;
  /** Trang đã mở hướng dẫn; bỏ trống với liên kết để khung theo người dùng sang trang mới. */
  path?: string;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 190;

const cardWidth = () => Math.min(CARD_WIDTH, Math.max(280, window.innerWidth - 24));

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/upload": "Nạp bài nộp",
  "/results": "Kết quả quét",
  "/compare": "So sánh",
  "/relations": "Biểu đồ quan hệ",
  "/ai-detect": "Phân loại AI",
  "/ai-detect/kho-mau": "Kho mẫu",
  "/ai-detect/cum": "Mô hình cụm",
  "/ai-detect/analyze": "Phân tích mã nguồn",
  "/profile": "Hồ sơ",
};

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

const labelOf = (el: HTMLElement) => {
  const direct = el.getAttribute("aria-label") || el.getAttribute("title");
  if (direct) return cleanText(direct);
  if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
    return cleanText(el.labels?.[0]?.textContent ?? el.closest("label")?.textContent ?? "tuỳ chọn này");
  }
  if (el instanceof HTMLSelectElement) {
    return cleanText(el.getAttribute("aria-label") ?? el.labels?.[0]?.textContent ?? "danh sách");
  }
  return cleanText(el.textContent ?? "").slice(0, 80) || "nút này";
};

/** Nội dung hướng dẫn tự động cho mọi nút/link chưa có data-guide riêng. */
const buildAutoGuide = (el: HTMLElement, label: string, pathname: string): GuideContent => {
  const page = PAGE_NAMES[pathname] ?? "trang hiện tại";
  const l = label.toLowerCase();

  if (el.tagName === "A") {
    return {
      title: `Đi tới: ${label}`,
      body: `Mở mục “${label}”. Bạn có thể quay lại bằng nút Trình duyệt nếu cần.`,
    };
  }
  if (el.getAttribute("role") === "switch") {
    return {
      title: "Công tắc bật / tắt",
      body: `Bấm để đổi trạng thái của “${label}”. Trạng thái được lưu lại cho lần sau.`,
    };
  }
  if (/xoá|xóa|trash|clear|remove|delete/.test(l)) {
    return {
      title: "Xoá dữ liệu",
      body: `Xoá mục đang chọn trên ${page}. Hệ thống sẽ hỏi xác nhận trước khi xoá để tránh mất dữ liệu.`,
    };
  }
  if (/huỷ|hủy|cancel|stop|dừng/.test(l)) {
    return {
      title: "Huỷ thao tác",
      body: `Dừng hành động đang chạy hoặc đóng bước hiện tại. Dữ liệu đã có vẫn được giữ nguyên.`,
    };
  }
  if (/quét|scan/.test(l)) {
    return {
      title: "Chạy quét",
      body: `Bắt đầu phân tích các bài nộp. Tiến trình và thời gian còn lại hiển thị theo số file thực tế.`,
    };
  }
  if (/nạp|tải lên|upload|chọn file|chọn tệp/.test(l)) {
    return {
      title: "Nạp dữ liệu",
      body: `Chọn file, thư mục hoặc file zip từ máy. Hệ thống sẽ tách zip và hiển thị từng file trước khi quét.`,
    };
  }
  if (/xuất|export|excel|pdf|báo cáo/.test(l)) {
    return {
      title: "Xuất báo cáo",
      body: `Tải dữ liệu của ${page} ra file để lưu trữ hoặc gửi kèm. Nếu trình duyệt chặn popup, hãy cho phép rồi thử lại.`,
    };
  }
  if (/sao chép|copy/.test(l)) {
    return {
      title: "Sao chép",
      body: `Sao chép nội dung vào bộ nhớ tạm. Bạn có thể dán vào trình soạn thảo hoặc báo cáo khác.`,
    };
  }
  if (/so sánh|compare|đối chiếu/.test(l)) {
    return {
      title: "So sánh",
      body: `Mở trang đối chiếu song song. Các đoạn giống nhau được tô màu để dễ rà soát.`,
    };
  }
  if (/tìm|search|lọc|filter/.test(l)) {
    return {
      title: "Tìm & lọc",
      body: `Thu hẹp danh sách theo từ khoá hoặc trạng thái. Kết quả cập nhật ngay khi bạn gõ.`,
    };
  }
  if (/phóng|zoom|thu nhỏ|vừa khung|fit|toàn màn hình/.test(l)) {
    return {
      title: "Điều chỉnh khung nhìn",
      body: `Phóng to, thu nhỏ hoặc căn lại nội dung cho vừa khung. Bạn cũng có thể lăn chuột để thu phóng.`,
    };
  }
  if (/trước|previous|quay lại|back/.test(l)) {
    return {
      title: "Quay lại",
      body: `Trở về bước hoặc trang trước đó mà không mất dữ liệu đang có.`,
    };
  }
  if (/tiếp|next|sau|hoàn tất|xong/.test(l)) {
    return {
      title: "Tiếp tục",
      body: `Đi tiếp sang bước kế tiếp. Bạn có thể quay lại bước trước nếu cần chỉnh cấu hình.`,
    };
  }
  if (/đóng|close|^x$/.test(l)) {
    return {
      title: "Đóng",
      body: `Đóng khung hoặc bảng đang mở để quay lại nội dung chính.`,
    };
  }
  if (/đặt lại|làm mới|reset|refresh|hiện lại/.test(l)) {
    return {
      title: "Đặt lại",
      body: `Đưa nội dung về trạng thái ban đầu. Thao tác này không ảnh hưởng tới dữ liệu đã lưu.`,
    };
  }
  if (/cài đặt|settings/.test(l)) {
    return {
      title: "Cài đặt",
      body: `Mở bảng cài đặt giao diện và hướng dẫn. Bạn có thể tắt hoặc bật lại hướng dẫn tại đây.`,
    };
  }
  if (/sáng|tối|theme|giao diện/.test(l)) {
    return {
      title: "Đổi giao diện",
      body: `Chuyển nhanh giữa nền sáng và nền tối. Lựa chọn được lưu cho lần truy cập sau.`,
    };
  }
  if (/chọn|select/.test(l)) {
    return {
      title: "Chọn mục",
      body: `Chọn “${label}” để áp dụng cho thao tác tiếp theo trên ${page}.`,
    };
  }
  return {
    title: label,
    body: `Thực hiện hành động “${label}” trên ${page}. Kết quả cập nhật ngay trên màn hình.`,
  };
};

export function GuidanceProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [settings, setSettings] = useState<GuidanceSettings>(readSettings);
  const [card, setCard] = useState<CardState | null>(null);
  const settingsRef = useRef(settings);

  // Khung hướng dẫn chỉ hiển thị ở đúng trang đã mở nó (trừ liên kết điều hướng).
  const visibleCard = card && (!card.path || card.path === pathname) ? card : null;

  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Bỏ qua nếu trình duyệt chặn lưu trữ.
    }
  }, [settings]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Bấm bên trong khung hướng dẫn thì để các nút của khung tự xử lý.
      if (target.closest('[role="dialog"][aria-label^="Hướng dẫn"]')) return;

      const explicit = target.closest<HTMLElement>("[data-guide]");
      const interactive = target.closest<HTMLElement>(
        'button, a, [role="button"], summary',
      );

      // Bấm ra ngoài mọi nút → đóng khung đang mở.
      if (!explicit && !interactive) {
        setCard(null);
        return;
      }

      const el = explicit ?? interactive;
      if (!el) return;

      const dataKey = explicit?.dataset.guide;
      const label = labelOf(el);
      const content =
        dataKey && GUIDES[dataKey]
          ? GUIDES[dataKey]
          : buildAutoGuide(el, label, window.location.pathname);
      if (!content) return;

      const key = dataKey ?? `auto|${window.location.pathname}|${el.tagName}|${label}`;
      const current = settingsRef.current;
      if (!current.enabled || current.seen.includes(key)) return;

      setSettings((value) =>
        value.seen.includes(key) ? value : { ...value, seen: [...value.seen, key] },
      );

      const rect = el.getBoundingClientRect();
      const width = cardWidth();
      const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - width / 2),
        Math.max(12, window.innerWidth - width - 12),
      );
      const below = rect.bottom + 10;
      const fitsBelow = below + CARD_HEIGHT <= window.innerHeight - 12;
      const isLink = el.tagName === "A";
      setCard({
        key,
        content,
        left,
        ...(isLink ? {} : { path: window.location.pathname }),
        ...(fitsBelow
          ? { top: below }
          : { bottom: Math.max(12, window.innerHeight - rect.top + 10) }),
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!card) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    // Đưa focus vào nút Đã hiểu để người dùng bàn phím có thể thoát nhanh.
    const focusTimer = window.setTimeout(() => {
      document.querySelector<HTMLElement>('[role="dialog"][aria-label^="Hướng dẫn"] button')?.focus();
    }, 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCard(null);
        previousFocus?.focus?.();
      }
      if (event.key === "Tab") {
        const box = document.querySelector<HTMLElement>('[role="dialog"][aria-label^="Hướng dẫn"]');
        const tabs = box?.querySelectorAll<HTMLElement>("button");
        if (!tabs || tabs.length === 0) return;
        const first = tabs[0];
        const last = tabs[tabs.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [card]);

  const setEnabled = useCallback((value: boolean) => {
    setSettings((current) => ({ ...current, enabled: value }));
    if (!value) setCard(null);
  }, []);

  const resetSeen = useCallback(() => {
    setSettings((current) => ({ ...current, seen: [] }));
    setCard(null);
  }, []);

  const value = useMemo<GuidanceContextValue>(
    () => ({
      enabled: settings.enabled,
      setEnabled,
      resetSeen,
      seenCount: settings.seen.length,
    }),
    [settings.enabled, settings.seen.length, setEnabled, resetSeen],
  );

  return (
    <GuidanceContext.Provider value={value}>
      {children}
      {visibleCard &&
        createPortal(
          <div
            role="dialog"
            aria-label={`Hướng dẫn: ${visibleCard.content.title}`}
            className="guide-in fixed z-[100] border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-900/15"
            style={{
              width: Math.min(CARD_WIDTH, Math.max(280, window.innerWidth - 24)),
              left: Math.min(visibleCard.left, Math.max(12, window.innerWidth - Math.min(CARD_WIDTH, window.innerWidth - 24) - 12)),
              ...(visibleCard.top !== undefined ? { top: visibleCard.top } : { bottom: visibleCard.bottom }),
              borderRadius: 12,
            }}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                <FaLightbulb size={12} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-stone-900">{visibleCard.content.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{visibleCard.content.body}</p>
              </div>
              <button
                type="button"
                onClick={() => setCard(null)}
                aria-label="Đóng hướng dẫn"
                className="shrink-0 rounded p-1 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                <FaXmark size={11} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setCard(null)}
                className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Đã hiểu
              </button>
              <button
                type="button"
                onClick={() => setEnabled(false)}
                className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Tắt hướng dẫn
              </button>
              <button
                type="button"
                onClick={() => {
                  setCard(null);
                  window.dispatchEvent(new Event("codex:open-settings"));
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md p-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                title="Mở cài đặt hướng dẫn"
              >
                <FaGear size={12} /> Cài đặt
              </button>
            </div>
          </div>,
          document.body,
        )}
    </GuidanceContext.Provider>
  );
}

export function useGuidance() {
  const context = useContext(GuidanceContext);
  if (!context) throw new Error("useGuidance must be used within a GuidanceProvider");
  return context;
}
