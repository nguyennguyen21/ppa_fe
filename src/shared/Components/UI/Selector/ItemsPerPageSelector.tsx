// ItemsPerPageSelector.tsx
import React from "react";
import { FaChevronDown } from "react-icons/fa";

export interface ItemsPerPageOption {
  value: number;
  label: string;
}

interface ItemsPerPageSelectorProps {
  // Dữ liệu
  value: number;
  options?: ItemsPerPageOption[] | number[];
  onChange: (value: number) => void;

  // Văn bản
  label?: string;
  labelPosition?: "left" | "top" | "right";

  // Kích thước
  size?: "sm" | "md" | "lg";

  // Màu sắc tùy chỉnh (Tailwind classes)
  containerClassName?: string;
  labelColor?: string;
  selectBgColor?: string;
  selectBorderColor?: string;
  selectTextColor?: string;
  selectFocusRing?: string;
  selectHoverBgColor?: string;
  iconColor?: string;

  // Hiển thị
  showLabel?: boolean;
  showIcon?: boolean;
  disabled?: boolean;
  width?: string;
}

const ItemsPerPageSelector: React.FC<ItemsPerPageSelectorProps> = ({
  value,
  options = [10, 25, 50, 100],
  onChange,
  label = "Số bài / trang",
  labelPosition = "left",
  size = "md",
  containerClassName,
  labelColor = "text-stone-700",
  selectBgColor = "bg-white",
  selectBorderColor = "border-stone-300",
  selectTextColor = "text-stone-800",
  selectFocusRing = "focus:border-stone-900",
  selectHoverBgColor = "hover:bg-stone-50",
  iconColor = "text-stone-600",
  showLabel = true,
  showIcon = true,
  disabled = false,
  width,
}) => {
  // Chuyển đổi options thành mảng chuẩn nếu là number[]
  const normalizedOptions: ItemsPerPageOption[] = options.map((opt) =>
    typeof opt === "number" ? { value: opt, label: opt.toString() } : opt
  );

  // Mapping kích thước
  const sizeClasses = {
    sm: {
      select: "px-2 py-1 text-xs",
      icon: "w-3 h-3",
      gap: "gap-2",
    },
    md: {
      select: "px-3 py-2 text-sm",
      icon: "w-4 h-4",
      gap: "gap-3",
    },
    lg: {
      select: "px-4 py-2.5 text-base",
      icon: "w-5 h-5",
      gap: "gap-4",
    },
  };

  const currentSize = sizeClasses[size];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value));
  };

  // Render layout dựa trên labelPosition
  const renderContent = () => {
    if (labelPosition === "top") {
      return (
        <div className={`flex flex-col ${currentSize.gap}`}>
          {showLabel && (
            <label className={`text-sm font-medium ${labelColor}`}>
              {label}
            </label>
          )}
          <div className="relative">
            <select
              value={value}
              onChange={handleChange}
              disabled={disabled}
              className={`appearance-none block rounded-md border shadow-sm transition-all focus:outline-none focus:ring-2 ${selectBgColor} ${selectBorderColor} ${selectTextColor} ${currentSize.select} ${selectFocusRing} ${selectHoverBgColor} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${width || "w-24"}`}
            >
              {normalizedOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {showIcon && (
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <FaChevronDown className={`${currentSize.icon} ${iconColor}`} />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default: left hoặc right
    return (
      <div
        className={`flex items-center ${currentSize.gap} ${labelPosition === "right" ? "flex-row-reverse" : ""}`}
      >
        {showLabel && (
          <label
            htmlFor="items-per-page"
            className={`text-sm font-medium whitespace-nowrap ${labelColor}`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id="items-per-page"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`appearance-none block rounded-md border shadow-sm transition-all focus:outline-none focus:ring-2 ${selectBgColor} ${selectBorderColor} ${selectTextColor} ${currentSize.select} ${selectFocusRing} ${selectHoverBgColor} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${width || "w-24"}`}
          >
            {normalizedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {showIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <FaChevronDown className={`${currentSize.icon} ${iconColor}`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={containerClassName}>
      {renderContent()}
    </div>
  );
};

export default ItemsPerPageSelector;