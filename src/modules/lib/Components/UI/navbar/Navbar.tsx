
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa6";

import SwitchButton from "../Button/SwitchButton";
import HamburgerBar from "./HambugerBar";
import SupportRoundButton from "./SupportRoundButton";
import SettingsMenu from "./SettingsMenu";
import { useTheme } from "../../../hook/theme-context";

interface NavbarProps {
  children: ReactNode;
}

const readOpenState = () => {
  try {
    const saved = localStorage.getItem("codex.sidebar.v1");
    if (saved === "1" || saved === "0") return saved === "1";
  } catch {
    // Bỏ qua nếu localStorage bị chặn.
  }
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
};

const Navbar = ({ children }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(readOpenState);
  const { isDark, toggle } = useTheme();

  const setMenuOpen = (value: boolean) => {
    setIsMenuOpen(value);
    try {
      localStorage.setItem("codex.sidebar.v1", value ? "1" : "0");
    } catch {
      // Bỏ qua nếu localStorage bị chặn.
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f6f7f5]/90 backdrop-blur dark:border-stone-800 dark:bg-[#151413]/90">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <SwitchButton
            checked={isMenuOpen}
            onChange={setMenuOpen}
            ariaLabel={isMenuOpen ? "Đóng thanh điều hướng" : "Mở thanh điều hướng"}
          />

          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-900 text-[13px] font-bold tracking-tight text-white">
              C
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-stone-900">CODEX</span>
              <span className="hidden text-xs text-stone-600 sm:block">Chống đạo văn cho bài nộp</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 text-xs text-stone-600 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Hệ thống sẵn sàng
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
              title={isDark ? "Giao diện sáng" : "Giao diện tối"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
            >
              {isDark ? <FaSun size={13} /> : <FaMoon size={13} />}
            </button>
            <SettingsMenu />
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-20 cursor-default bg-stone-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="flex">
        <aside
          className={[
            "z-30 shrink-0 overflow-x-hidden overflow-y-auto border-r border-stone-200/70 bg-white",
            "fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-[240px] transition-transform duration-300 ease-in-out",
            "lg:sticky lg:top-14 lg:left-auto lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:transition-[width,padding]",
            isMenuOpen ? "translate-x-0" : "-translate-x-full",
            isMenuOpen ? "lg:w-[224px] lg:p-3" : "lg:w-0 lg:p-0 lg:overflow-hidden",
          ].join(" ")}
          aria-hidden={!isMenuOpen}
        >
          {isMenuOpen && (
            <HamburgerBar
              orientation="vertical"
              showLabels
              width="100%"
              itemSize="44px"
              iconSize={18}
              iconScale={1}
              gap={2}
              background="transparent"
              iconColor="#78716c"
              activeColor="#292524"
              activeBackground="#f5f5f4"
              hoverBackground="#fafaf9"
              borderColor="transparent"
              rounded="8px"
              duration={200}
              shadow={false}
              ariaLabel="Thanh điều hướng chính"
              className="w-full border-none ml-0"
              onNavigate={() => {
                if (window.matchMedia("(max-width: 1023px)").matches) setMenuOpen(false);
              }}
              footer={<SupportRoundButton />}
            />
          )}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Navbar;
