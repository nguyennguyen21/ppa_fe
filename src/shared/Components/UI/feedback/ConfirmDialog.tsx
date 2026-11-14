/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { FaTriangleExclamation } from "react-icons/fa6";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | undefined>(
  undefined,
);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (value: boolean) => {
      setState((current) => {
        current?.resolve(value);
        return null;
      });
    },
    [],
  );

  useEffect(() => {
    if (!state) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    confirmButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
        return;
      }
      if (event.key === "Enter") {
        // Chỉ xác nhận khi focus đang ở nút xác nhận để tránh nuốt Enter trong input khác.
        if (document.activeElement === confirmButtonRef.current) close(true);
        return;
      }
      if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
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
      previousFocusRef.current?.focus?.();
    };
  }, [state, close]);

  const danger = state?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state &&
        createPortal(
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Đóng hộp thoại xác nhận"
              className="absolute inset-0 cursor-default bg-stone-950/45 backdrop-blur-sm"
              onClick={() => close(false)}
            />
            <div
              ref={dialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby={state.description ? "confirm-description" : undefined}
              className="modal-in relative w-full max-w-md border border-stone-200 bg-white p-6 shadow-2xl"
              style={{ borderRadius: 12 }}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${
                    danger
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : "bg-stone-100 text-stone-700 ring-stone-200"
                  }`}
                >
                  <FaTriangleExclamation size={17} />
                </span>
                <div className="min-w-0">
                  <h2 id="confirm-title" className="font-serif text-xl font-semibold text-stone-900">
                    {state.title}
                  </h2>
                  {state.description && (
                    <p
                      id="confirm-description"
                      className="mt-2 text-sm leading-relaxed text-stone-600"
                    >
                      {state.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  {state.cancelLabel ?? "Huỷ"}
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={() => close(true)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors ${
                    danger ? "bg-red-700 hover:bg-red-800" : "bg-stone-900 hover:bg-stone-800"
                  }`}
                >
                  {state.confirmLabel ?? "Xác nhận"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within a ConfirmProvider");
  return context;
}
