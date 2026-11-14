/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleInfo,
  FaXmark,
} from "react-icons/fa6";

export type ToastVariant = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  push: (input: ToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const icons = {
  success: FaCircleCheck,
  error: FaCircleExclamation,
  info: FaCircleInfo,
} as const;

const tones = {
  success: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bar: "bg-emerald-600",
  },
  error: {
    icon: "bg-red-50 text-red-700 ring-red-200",
    bar: "bg-red-600",
  },
  info: {
    icon: "bg-stone-100 text-stone-700 ring-stone-200",
    bar: "bg-stone-700",
  },
} as const;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setItems((list) => list.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    ({ title, description, variant = "info", duration = 4600 }: ToastInput) => {
      const id = newId();
      setItems((list) => [...list.slice(-3), { id, title, description, variant, duration }]);
      const timer = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      dismiss,
      success: (title, description) => push({ title, description, variant: "success" }),
      error: (title, description) => push({ title, description, variant: "error" }),
      info: (title, description) => push({ title, description, variant: "info" }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
          role="region"
          aria-label="Thông báo"
        >
          {items.map((item) => {
            const Icon = icons[item.variant];
            const tone = tones[item.variant];
            return (
              <div
                key={item.id}
                role="status"
                className="toast-in pointer-events-auto flex w-full items-start gap-3 overflow-hidden border border-stone-200 bg-white p-3.5 shadow-lg shadow-stone-900/10"
                style={{ borderRadius: 10 }}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${tone.icon}`}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-snug text-stone-900">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{item.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Đóng thông báo"
                  className="shrink-0 rounded p-1 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  <FaXmark size={12} />
                </button>
                <span className={`absolute bottom-0 left-0 h-0.5 ${tone.bar}`} />
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
