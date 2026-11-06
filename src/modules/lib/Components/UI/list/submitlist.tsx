// SubmissionsList.tsx
import React from "react";
import { FaChevronRight, FaInfoCircle } from "react-icons/fa";

interface SubmissionItem {
  id: string;
  fileName: string;
  label: "plagiarism" | "innocent" | string;
  similarity: number;
}

interface SubmissionsListProps {
  title?: string;
  description?: string;
  submissions?: SubmissionItem[];
  viewAllText?: string;
  viewAllCount?: number;
  onViewAllClick?: () => void;

  // Màu sắc tùy chỉnh
  titleColor?: string;
  descriptionColor?: string;
  fileNameColor?: string;
  linkColor?: string;
  cardBgColor?: string;

  // Màu cho labels
  plagiarismColor?: string;
  plagiarismBgColor?: string;
  innocentColor?: string;
  innocentBgColor?: string;
  customLabels?: Record<string, { color: string; bgColor: string }>;

  // Màu progress bar
  progressBarBgColor?: string;
  progressBarFillColor?: string;
  progressBarTextColor?: string;

  // Tùy chọn hiển thị
  showInfoIcon?: boolean;
  showViewAll?: boolean;
  maxDisplayItems?: number;
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  title = "Submissions",
  description = "Highlights the most suspicious individual submissions, useful for exams.",
  submissions = [
    { id: "1", fileName: "064.c", label: "plagiarism", similarity: 97 },
    { id: "2", fileName: "026.c", label: "plagiarism", similarity: 97 },
    { id: "3", fileName: "045.c", label: "plagiarism", similarity: 88 },
    { id: "4", fileName: "051.c", label: "plagiarism", similarity: 88 },
    { id: "5", fileName: "040.c", label: "innocent", similarity: 88 },
  ],
  viewAllText = "View all",
  viewAllCount = 79,
  onViewAllClick,
  titleColor = "text-gray-900",
  descriptionColor = "text-gray-500",
  fileNameColor = "text-gray-700",
  linkColor = "text-blue-600",
  cardBgColor = "bg-white",
  plagiarismColor = "text-orange-600",
  plagiarismBgColor = "bg-orange-500",
  innocentColor = "text-blue-600",
  innocentBgColor = "bg-blue-500",
  customLabels,
  progressBarBgColor = "bg-gray-200",
  progressBarFillColor = "bg-gray-500",
  progressBarTextColor = "text-gray-900",
  showInfoIcon = true,
  showViewAll = true,
  maxDisplayItems = 10,
}) => {
  const getLabelColors = (label: string) => {
    if (customLabels?.[label]) {
      return customLabels[label];
    }
    if (label === "plagiarism") {
      return { color: plagiarismColor, bgColor: plagiarismBgColor };
    }
    if (label === "innocent") {
      return { color: innocentColor, bgColor: innocentBgColor };
    }
    return { color: "text-gray-600", bgColor: "bg-gray-500" };
  };

  const displaySubmissions = submissions.slice(0, maxDisplayItems);
  const hasMore = submissions.length > maxDisplayItems;

  return (
    <div
      className={`${cardBgColor} rounded-lg shadow-md border border-gray-200 p-6`}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className={`text-xl font-semibold ${titleColor}`}>{title}</h2>
          {showInfoIcon && (
            <FaInfoCircle className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
          )}
        </div>
        <p className={`text-sm ${descriptionColor}`}>{description}</p>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 mb-3 text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
        <div className="col-span-4">Submission</div>
        <div className="col-span-4">Label</div>
        <div className="col-span-4 text-right">Highest similarity</div>
      </div>

      {/* Submissions List */}
      <div className="space-y-2">
        {displaySubmissions.map((submission, index) => {
          const labelColors = getLabelColors(submission.label);
          return (
            <div
              key={submission.id}
              className={`grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-md transition-colors ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-gray-100`}
            >
              {/* File Name */}
              <div className={`col-span-4 font-medium ${fileNameColor}`}>
                {submission.fileName}
              </div>

              {/* Label */}
              <div className="col-span-4 flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${labelColors.bgColor}`}
                />
                <span className={`text-sm ${labelColors.color}`}>
                  {submission.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="col-span-4 flex items-center justify-end gap-3">
                <div className="relative w-32 h-7 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-0 ${progressBarBgColor}`}
                  />
                  <div
                    className={`absolute inset-y-0 left-0 ${progressBarFillColor} transition-all duration-500`}
                    style={{ width: `${submission.similarity}%` }}
                  />
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${progressBarTextColor}`}
                  >
                    {submission.similarity}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {showViewAll && hasMore && (
        <button
          onClick={onViewAllClick}
          className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${linkColor} hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer w-full`}
        >
          {viewAllText} {viewAllCount} submissions
          <FaChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SubmissionsList;