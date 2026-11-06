// CategorySearchBar.tsx
import React, { useState, useRef, useEffect } from "react";
import { FaThLarge, FaChevronDown, FaSearch } from "react-icons/fa";

export interface CategoryOption {
  id: string;
  label: string;
}

interface CategorySearchBarProps {
  // Dữ liệu
  categories?: CategoryOption[];
  placeholder?: string;
  buttonText?: string;
  
  // Kích thước
  size?: "sm" | "md" | "lg";
  
  // Màu sắc tùy chỉnh (Tailwind classes)
  containerBgColor?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  inputFocusRing?: string;
  dropdownButtonBg?: string;
  dropdownButtonHoverBg?: string;
  searchButtonBg?: string;
  searchButtonHoverBg?: string;
  textColor?: string;
  dropdownBgColor?: string;
  dropdownHoverBg?: string;
  
  // Sự kiện
  onSearch?: (query: string, categoryId: string) => void;
  onCategoryChange?: (category: CategoryOption) => void;
}

const CategorySearchBar: React.FC<CategorySearchBarProps> = ({
  categories = [
    { id: "all", label: "Tất cả danh mục" },
    { id: "shopping", label: "Mua sắm" },
    { id: "images", label: "Hình ảnh" },
    { id: "news", label: "Tin tức" },
    { id: "finance", label: "Tài chính" },
  ],
  placeholder = "Tìm kiếm sản phẩm...",
  buttonText = "Tìm kiếm",
  size = "md",
  containerBgColor = "bg-white",
  inputBgColor = "bg-gray-50",
  inputBorderColor = "border-gray-300",
  inputFocusRing = "focus:ring-blue-500 focus:border-blue-500",
  dropdownButtonBg = "bg-gray-100",
  dropdownButtonHoverBg = "hover:bg-gray-200",
  searchButtonBg = "bg-blue-600",
  searchButtonHoverBg = "hover:bg-blue-700",
  textColor = "text-gray-800",
  dropdownBgColor = "bg-white",
  dropdownHoverBg = "hover:bg-gray-100",
  onSearch,
  onCategoryChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>(categories[0]);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mapping kích thước
  const sizeClasses = {
    sm: {
      btn: "text-xs px-3 py-2",
      input: "text-xs px-3 py-2",
      icon: "w-3 h-3",
      dropdown: "w-40",
    },
    md: {
      btn: "text-sm px-4 py-2.5",
      input: "text-sm px-4 py-2.5",
      icon: "w-4 h-4",
      dropdown: "w-48",
    },
    lg: {
      btn: "text-base px-5 py-3",
      input: "text-base px-5 py-3",
      icon: "w-5 h-5",
      dropdown: "w-56",
    },
  };

  const currentSize = sizeClasses[size];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query, selectedCategory.id);
  };

  const handleCategorySelect = (category: CategoryOption) => {
    setSelectedCategory(category);
    setIsOpen(false);
    onCategoryChange?.(category);
  };

  return (
    <form onSubmit={handleSearch} className={`w-full max-w-2xl mx-auto`}>
      <div className={`flex shadow-sm rounded-lg overflow-hidden -space-x-px ${containerBgColor}`}>
        
        {/* Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center shrink-0 z-10 font-medium leading-5 rounded-s-lg border-r ${inputBorderColor} ${dropdownButtonBg} ${dropdownButtonHoverBg} ${textColor} ${currentSize.btn} focus:outline-none focus:ring-2 ${inputFocusRing} transition-colors`}
            aria-expanded={isOpen}
          >
            <FaThLarge className={`${currentSize.icon} me-2 opacity-70`} />
            {selectedCategory.label}
            <FaChevronDown className={`${currentSize.icon} ms-2 opacity-70`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className={`absolute z-20 mt-1 ${currentSize.dropdown} ${dropdownBgColor} border ${inputBorderColor} rounded-lg shadow-xl`}>
              <ul className="py-1 text-sm font-medium">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`block w-full text-left px-4 py-2 ${textColor} ${dropdownHoverBg} transition-colors ${
                        selectedCategory.id === cat.id ? "bg-blue-50 text-blue-600 font-semibold" : ""
                      }`}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-grow">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`block w-full border ${inputBorderColor} ${inputBgColor} ${textColor} ${currentSize.input} placeholder-gray-400 focus:outline-none focus:ring-2 ${inputFocusRing} transition-all`}
            placeholder={placeholder}
            required
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className={`inline-flex items-center justify-center shrink-0 font-medium leading-5 rounded-e-lg border border-transparent text-white ${searchButtonBg} ${searchButtonHoverBg} ${currentSize.btn} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm`}
        >
          <FaSearch className={`${currentSize.icon} me-2`} />
          {buttonText}
        </button>
        
      </div>
    </form>
  );
};

export default CategorySearchBar;