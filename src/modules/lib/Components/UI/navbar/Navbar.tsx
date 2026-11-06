
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import SwitchButton from "../Button/SwitchButton";
import HamburgerBar from "./HambugerBar";

interface NavbarProps {
  children: ReactNode;
}

const Navbar = ({ children }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f6f7f5]/90 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <SwitchButton
            checked={isMenuOpen}
            onChange={setIsMenuOpen}
            ariaLabel={isMenuOpen ? "Đóng thanh điều hướng" : "Mở thanh điều hướng"}
          />

          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-900 text-[13px] font-bold tracking-tight text-white">
              C
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-stone-900">CODEX</span>
              <span className="block text-[11px] text-stone-500">Chống đạo văn cho bài nộp</span>
            </span>
          </Link>

          <span className="ml-auto hidden items-center gap-2 text-xs text-stone-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Hệ thống sẵn sàng
          </span>
        </div>
      </header>

      <div className="flex">
        <aside
          className={[
            "sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 overflow-x-hidden overflow-y-auto border-r border-stone-200/70 bg-white",
            "transition-[width,padding] duration-300 ease-in-out",
            isMenuOpen ? "w-[224px] p-3" : "w-0 overflow-hidden p-0",
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
