/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Density = "compact" | "comfortable";

interface Prefs {
  density: Density;
  colorBlind: boolean;
}

interface PrefsContextValue extends Prefs {
  setDensity: (d: Density) => void;
  setColorBlind: (v: boolean) => void;
}

const KEY = "codex.prefs.v1";
const PrefsContext = createContext<PrefsContextValue | undefined>(undefined);

const readPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return {
        density: parsed.density === "compact" ? "compact" : "comfortable",
        colorBlind: parsed.colorBlind === true,
      };
    }
  } catch {
    // Bỏ qua nếu dữ liệu hỏng.
  }
  return { density: "comfortable", colorBlind: false };
};

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(readPrefs);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = prefs.density;
    root.dataset.colorblind = prefs.colorBlind ? "1" : "0";
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      // Bỏ qua nếu trình duyệt chặn lưu trữ.
    }
  }, [prefs]);

  const setDensity = useCallback(
    (density: Density) => setPrefsState((p) => ({ ...p, density })),
    [],
  );
  const setColorBlind = useCallback(
    (colorBlind: boolean) => setPrefsState((p) => ({ ...p, colorBlind })),
    [],
  );

  const value = useMemo<PrefsContextValue>(
    () => ({ ...prefs, setDensity, setColorBlind }),
    [prefs, setDensity, setColorBlind],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within a PrefsProvider");
  return ctx;
}
