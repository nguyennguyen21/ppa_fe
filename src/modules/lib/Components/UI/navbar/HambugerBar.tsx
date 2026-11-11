
import { useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import { useTheme } from "../../../hook/theme-context";

import { MdDashboard, MdPerson } from "react-icons/md";
import { FaUpload, FaCodeCompare, FaListCheck, FaChartSimple, FaRobot, FaCircleNodes } from "react-icons/fa6";

// 1. Kiểu dữ liệu của từng mục menu
export interface HamburgerBarItem {
  id: string;
  label: string;
  icon: IconType;
  to: string;
  end?: boolean;
  disabled?: boolean;
}

// 2. Danh sách menu mặc định
const defaultItems: HamburgerBarItem[] = [
  {
    id: "dashboard",
    label: "Tổng quan",
    icon: MdDashboard,
    to: "/dashboard",
    end: true,
  },
  {
    id: "upload",
    label: "Nạp bài nộp",
    icon: FaUpload,
    to: "/upload",
  },
  {
    id: "results",
    label: "Kết quả quét",
    icon: FaListCheck,
    to: "/results",
  },
  {
    id: "ai-detect",
    label: "Phân loại AI",
    icon: FaRobot,
    to: "/ai-detect",
  },
  {
    id: "ai-cluster",
    label: "Mô hình cụm",
    icon: FaCircleNodes,
    to: "/ai-detect/cum",
  },
  {
    id: "compare",
    label: "So sánh code",
    icon: FaCodeCompare,
    to: "/compare",
  },
  {
    id: "relations",
    label: "Biểu đồ quan hệ",
    icon: FaChartSimple,
    to: "/relations",
  },
  {
    id: "profile",
    label: "Hồ sơ",
    icon: MdPerson,
    to: "/profile",
  },
];

// 3. Kiểu dữ liệu của component
export interface HamburgerBarProps {
  items?: HamburgerBarItem[];
  defaultActive?: string;
  orientation?: "vertical" | "horizontal";
  showLabels?: boolean;
  width?: string;
  itemSize?: string;
  gap?: number | string;
  background?: string;
  iconColor?: string;
  activeColor?: string;
  activeBackground?: string;
  hoverBackground?: string;
  borderColor?: string;
  rounded?: string;
  duration?: number;
  iconSize?: number;
  iconScale?: number;
  shadow?: boolean;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  ariaLabel?: string;
  onActiveChange?: (
    id: string,
    item: HamburgerBarItem
  ) => void;
  onItemClick?: (
    item: HamburgerBarItem,
    event: MouseEvent<HTMLAnchorElement>
  ) => void;
  /** Gọi sau khi người dùng chọn một mục (dùng để đóng drawer trên mobile). */
  onNavigate?: () => void;
  /** Nội dung bổ sung hiển thị sau danh sách mục (ví dụ: nút tròn ủng hộ). */
  footer?: ReactNode;
}

// 4. Component chính
const HamburgerBar = ({
  items = defaultItems,
  defaultActive = "upload",
  orientation = "vertical",
  showLabels = false,
  width = "64px",
  itemSize = "64px",
  gap = 4,
  background = "#ffffff",
  iconColor = "#111827",
  activeColor = "#60a5fa",
  activeBackground = "#eff6ff",
  hoverBackground = "#f3f4f6",
  borderColor = "rgba(17, 24, 39, 0.1)",
  rounded = "12px",
  duration = 300,
  iconSize = 24,
  iconScale = 1.15,
  shadow = true,
  disabled = false,
  className = "",
  itemClassName = "",
  activeClassName = "",
  ariaLabel = "Thanh điều hướng",
  onActiveChange,
  onItemClick,
  onNavigate,
  footer,
}: HamburgerBarProps) => {
  // Lấy đường dẫn hiện tại từ React Router DOM
  const location = useLocation();
  const { isDark } = useTheme();

  // Bảng màu tự đổi theo theme; vẫn cho phép ghi đè qua props khi cần.
  const resolvedIconColor = isDark ? "#a8a29e" : iconColor;
  const resolvedActiveColor = isDark ? "#f5f5f4" : activeColor;
  const resolvedActiveBackground = isDark ? "#2a2827" : activeBackground;
  const resolvedHoverBackground = isDark ? "#232120" : hoverBackground;
  const resolvedBorderColor = isDark ? "#3a3735" : borderColor;

  // Giữ state ban đầu của bạn
  const [internalActiveId, setInternalActiveId] =
    useState(defaultActive);

  const isVertical = orientation === "vertical";

  // Kiểm tra mục menu có tương ứng với URL hiện tại không
  const getActiveItem = () => {
    return items.find((item) => {
      if (item.disabled || disabled) {
        return false;
      }

      if (item.end) {
        return location.pathname === item.to;
      }

      return (
        location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`)
      );
    });
  };

  // Ưu tiên đường dẫn hiện tại; nếu chưa khớp thì dùng state ban đầu
  const matchedItem = getActiveItem();

  const activeId = matchedItem
    ? matchedItem.id
    : internalActiveId;

  // 5. Giao diện của thanh điều hướng
  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    gap,
    width: isVertical ? width : "fit-content",
    padding: 4,
    boxSizing: "border-box",
    background,
    border: `1px solid ${resolvedBorderColor}`,
    borderRadius: rounded,
    boxShadow: shadow
      ? "0 8px 24px rgba(0, 0, 0, 0.08)"
      : "none",
    opacity: disabled ? 0.5 : 1,
    transition: `all ${duration}ms ease-in-out`,
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={`hamburger-bar ${className}`}
      style={containerStyle}
    >
      {items.map((item) => {
        const Icon = item.icon;

        // Mục được chọn dựa trên URL thực tế
        const isActive = activeId === item.id;

        const isDisabled =
          disabled || Boolean(item.disabled);

        // 6. Giao diện từng mục menu
        const itemStyle: CSSProperties = {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: showLabels
            ? "flex-start"
            : "center",
          gap: 12,
          width: isVertical ? "100%" : "auto",
          minWidth: isVertical ? undefined : itemSize,
          height: itemSize,
          padding: showLabels ? "0 16px" : 12,
          boxSizing: "border-box",
          color: isActive ? resolvedActiveColor : resolvedIconColor,
          background: isActive ? resolvedActiveBackground : "transparent",
          border: isActive
            ? `1px solid ${resolvedBorderColor}`
            : "1px solid transparent",
          borderRadius: rounded,
          cursor: isDisabled
            ? "not-allowed"
            : "pointer",
          opacity: isDisabled ? 0.45 : 1,
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: `all ${duration}ms ease-in-out`,
        };

        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end ?? false}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={isDisabled || undefined}
            title={!showLabels ? item.label : undefined}
            tabIndex={isDisabled ? -1 : undefined}
            className={[
              "hamburger-bar__item",
              itemClassName,
              isActive ? activeClassName : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              {
                ...itemStyle,
                "--hb-hover": resolvedHoverBackground,
              } as CSSProperties
            }
            onClick={(event) => {
              if (isDisabled) {
                event.preventDefault();
                return;
              }

              // Cập nhật mục được chọn
              setInternalActiveId(item.id);

              // Gọi callback khi mục menu được chọn
              onActiveChange?.(item.id, item);

              // Gọi callback khi nhấn vào mục menu
              onItemClick?.(item, event);
              onNavigate?.();
            }}
          >
            <Icon
              size={iconSize}
              aria-hidden="true"
              style={{
                flexShrink: 0,
                transform: isActive
                  ? `scale(${iconScale})`
                  : "scale(1)",
                transition: `all ${duration}ms ease-in-out`,
              }}
            />

            {showLabels && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            )}
          </NavLink>
        );
      })}

      {footer}
    </nav>
  );
};

export default HamburgerBar;
