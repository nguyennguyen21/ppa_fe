/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = "codex.theme.v1";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readStored = (): ThemeMode => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // localStorage có thể bị chặn; dùng mặc định.
  }
  return "system";
};

const systemPrefersDark = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStored);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Lắng nghe thay đổi tuỳ chọn hệ thống (chỉ khi đang ở chế độ "system").
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  // Đồng bộ DOM + lưu lựa chọn: đây là cập nhật hệ thống bên ngoài, không setState.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#111110" : "#f6f7f5");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Bỏ qua nếu trình duyệt chặn lưu trữ.
    }
  }, [theme, isDark]);

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), []);

  const toggle = useCallback(
    () =>
      setThemeState((current) => {
        const dark =
          current === "dark" || (current === "system" && systemPrefersDark());
        return dark ? "light" : "dark";
      }),
    [],
  );

  const value = useMemo(
    () => ({ theme, isDark, setTheme, toggle }),
    [theme, isDark, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
