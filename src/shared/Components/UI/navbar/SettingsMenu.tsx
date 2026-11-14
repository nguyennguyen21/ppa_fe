import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  FaDesktop,
  FaGear,
  FaLightbulb,
  FaMoon,
  FaPrint,
  FaRotateLeft,
  FaSun,
  FaXmark,
} from "react-icons/fa6";
import { useTheme, type ThemeMode } from "../../../hook/theme-context";
import { useGuidance } from "../guidance/Guidance";
import { usePrefs } from "../../../hook/prefs-context";

const themes: Array<{ id: ThemeMode; label: string; icon: typeof FaSun }> = [
  { id: "light", label: "Sáng", icon: FaSun },
  { id: "dark", label: "Tối", icon: FaMoon },
  { id: "system", label: "Hệ thống", icon: FaDesktop },
];

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { enabled, setEnabled, resetSeen, seenCount } = useGuidance();
  const { density, setDensity, colorBlind, setColorBlind } = usePrefs();
  const wrapRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("codex:open-settings", onOpen);
    return () => window.removeEventListener("codex:open-settings", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const tabs = dialogRef.current?.querySelectorAll<HTMLElement>("button, input, select, [tabindex]");
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
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  const onDialogTab = (event: ReactKeyboardEvent) => {
    // Trap nhẹ ngay trên dialog để không bị lạc focus ra nền trang.
    if (event.key !== "Tab") return;
    const tabs = dialogRef.current?.querySelectorAll<HTMLElement>("button, input, select, [tabindex]");
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
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Cài đặt giao diện và hướng dẫn"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-guide="settings-theme"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
          open
            ? "border-stone-900 bg-stone-900 text-white"
            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
        }`}
      >
        <FaGear size={13} />
      </button>

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Cài đặt"
          aria-modal="true"
          onKeyDown={onDialogTab}
          className="absolute right-0 top-full z-50 mt-2 w-72 border border-stone-200 bg-white p-4 shadow-xl shadow-stone-900/10"
          style={{ borderRadius: 12 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-stone-900">Cài đặt</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng cài đặt"
              className="rounded p-1 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <FaXmark size={11} />
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Giao diện</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label="Chọn giao diện">
              {themes.map((item) => {
                const Icon = item.icon;
                const active = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 border px-2 py-2.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                    }`}
                    style={{ borderRadius: 8 }}
                  >
                    <Icon size={13} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Hiển thị</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5" role="group" aria-label="Mật độ hiển thị">
              {(
                [
                  { id: "compact" as const, label: "Gọn" },
                  { id: "comfortable" as const, label: "Thoải mái" },
                ]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDensity(item.id)}
                  aria-pressed={density === item.id}
                  className={`border px-2 py-2 text-xs font-medium transition-colors ${
                    density === item.id
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                  }`}
                  style={{ borderRadius: 8 }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={colorBlind}
                onChange={(e) => setColorBlind(e.target.checked)}
                className="h-4 w-4 accent-stone-900"
              />
              Chế độ mù màu (dùng nét liền / đứt thay vì chỉ màu)
            </label>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.print();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <FaPrint /> In trang hiện tại
            </button>
          </div>

          <div className="mt-4 border-t border-stone-100 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-900">
                  <FaLightbulb size={11} className="text-amber-600" /> Hướng dẫn khi bấm nút
                </p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  Hiện khung nhỏ giải thích chức năng của nút trong lần bấm đầu tiên.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label="Bật hoặc tắt hướng dẫn"
                onClick={() => setEnabled(!enabled)}
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
                  enabled ? "bg-stone-900" : "bg-stone-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    enabled ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-stone-600">Đã xem {seenCount} hướng dẫn</span>
              <button
                type="button"
                onClick={resetSeen}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                <FaRotateLeft size={10} /> Hiện lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
