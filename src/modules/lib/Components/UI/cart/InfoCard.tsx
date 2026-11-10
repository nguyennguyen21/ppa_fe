// InfoCard.tsx
import React from "react";
// Import icon mặc định từ react-icons (có thể đổi sang bộ icon khác như hi, md, bs...)
import { FaChartLine, FaInfoCircle } from "react-icons/fa"; 

interface InfoCardProps {
  title?: string;
  value?: string | number;
  valueSuffix?: string;
  linkText?: string;
  // Chấp nhận bất kỳ ReactNode nào (bao gồm component từ react-icons)
  icon?: React.ReactNode; 
  description?: string;

  // Màu sắc tùy chỉnh
  titleColor?: string;
  valueColor?: string;
  linkColor?: string;
  descriptionColor?: string;
  iconBgColor?: string;
  iconColor?: string;
  cardBgColor?: string;

  // Tùy chọn hiển thị
  showInfoIcon?: boolean;
  showLink?: boolean;
  showDescription?: boolean;
  onLinkClick?: () => void;
  onCardClick?: () => void;

  // Kích thước
  size?: "sm" | "md" | "lg";
}

const InfoCard: React.FC<InfoCardProps> = ({
  title = "Highest similarity",
  value = "97",
  valueSuffix = "%",
  linkText = "View submissions",
  icon,
  description,
  titleColor = "text-stone-900",
  valueColor = "text-stone-900",
  linkColor = "text-stone-700 underline",
  descriptionColor = "text-stone-600",
  iconBgColor = "bg-stone-100",
  iconColor = "text-stone-700",
  cardBgColor = "bg-white",
  showInfoIcon = true,
  showLink = true,
  showDescription = false,
  onLinkClick,
  onCardClick,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-full p-3",
    md: "w-full p-5",
    lg: "w-full p-6",
  };

  const iconSizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  };

  const valueSizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  const iconSvgSizeClasses = {
    sm: "text-xl", // React-icons dùng text-size để scale tốt hơn w/h
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div
      onClick={onCardClick}
      className={`${cardBgColor} ${sizeClasses[size]} rounded-lg border border-stone-200 shadow-sm flex items-start gap-4 ${
        onCardClick ? "transition-transform hover:scale-[1.02] cursor-pointer" : ""
      }`}
    >
      {/* Icon Area */}
      <div
        className={`${iconBgColor} ${iconSizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        {icon || (
          <FaChartLine className={`${iconColor} ${iconSvgSizeClasses[size]}`} />
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-1 min-w-0">
        {/* Title Row */}
        <div className="flex items-center gap-2">
          <h2 className={`text-lg font-semibold ${titleColor} truncate`}>
            {title}
          </h2>
          {showInfoIcon && (
            <FaInfoCircle className="w-5 h-5 text-stone-600 cursor-help flex-shrink-0 hover:text-stone-900 transition-colors" />
          )}
        </div>

        {/* Description */}
        {showDescription && description && (
          <p className={`text-sm ${descriptionColor}`}>{description}</p>
        )}

        {/* Value */}
        <p className={`${valueSizeClasses[size]} font-bold ${valueColor}`}>
          {value}
          {valueSuffix && (
            <span className="text-lg font-medium ml-1">{valueSuffix}</span>
          )}
        </p>

        {/* Link */}
        {showLink && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Ngăn sự kiện click lan lên card
              onLinkClick?.();
            }}
            className={`text-sm font-medium ${linkColor} hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer text-left p-0`}
          >
            {linkText}
          </button>
        )}
      </div>
    </div>
  );
};

export default InfoCard;