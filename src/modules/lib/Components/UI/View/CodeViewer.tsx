// CodeViewer.tsx
import React, { useState } from "react";
// 1. Sửa lỗi verbatimModuleSyntax: Tách import type ra riêng
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";

// 2. Sửa lỗi tên theme: Sử dụng đúng tên theme có sẵn trong thư mục 'prism'
import {
  oneLight,      // Thay cho atomOneLight
  atomDark,      // Thay cho atomOneDark
  coldarkCold,   // Theme sáng, giống GitHub/VS Code Light
  vscDarkPlus,   // Theme tối, giống VS Code Dark+
  xonokai,       // Theme tối, giống Monokai
  dracula,       // Theme Dracula (có sẵn trong prism)
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaRegCopy, FaCheck } from "react-icons/fa";

// ===== Types =====
// Cập nhật lại tên các theme hợp lệ của Prism
export type CodeTheme = "oneLight" | "atomDark" | "coldarkCold" | "vscDarkPlus" | "xonokai" | "dracula";
export type DiffLineType = "added" | "removed" | "unchanged" | "none";

export interface DiffLine {
  type: DiffLineType;
  content?: string;
}

interface CodeViewerProps {
  code: string;
  language?: string;
  theme?: CodeTheme;
  fontSize?: string;
  lineHeight?: string;
  showDiffMarkers?: boolean;
  diffLines?: DiffLine[];
  
  addedLineColor?: string;
  removedLineColor?: string;
  addedMarkerColor?: string;
  removedMarkerColor?: string;
  lineNumberColor?: string;
  
  title?: string;
  height?: string;
  maxHeight?: string;
  borderRadius?: string;
  showCopyButton?: boolean;
  className?: string;
}

// ===== Map theme =====
const themeMap: Record<CodeTheme, SyntaxHighlighterProps["style"]> = {
  oneLight,
  atomDark,
  coldarkCold,
  vscDarkPlus,
  xonokai,
  dracula,
};

const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = "c",
  theme = "oneLight",
  fontSize = "14px",
  lineHeight = "24px",
  showDiffMarkers = true,
  diffLines,
  addedLineColor = "rgba(46, 160, 67, 0.15)",
  removedLineColor = "rgba(218, 54, 51, 0.15)",
  addedMarkerColor = "#2ea043",
  removedMarkerColor = "#da3633",
  lineNumberColor = "#999",
  title,
  height,
  maxHeight = "500px",
  borderRadius = "8px",
  showCopyButton = true,
  className,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const lines = code.split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div
      className={`flex flex-col border border-gray-200 overflow-hidden bg-white ${className || ""}`}
      style={{ borderRadius, height, maxHeight }}
    >
      {/* Title Bar */}
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-mono font-medium text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {title}
          </span>
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-md transition-all hover:shadow-sm"
            >
              {isCopied ? <FaCheck className="text-green-600" /> : <FaRegCopy />}
              {isCopied ? "Đã sao chép" : "Sao chép"}
            </button>
          )}
        </div>
      )}

      {/* Code Area */}
      <div className="flex flex-1 overflow-auto custom-scrollbar">
        
        {/* Cột số dòng & Dấu +/- */}
        <div 
          className="flex flex-col select-none bg-gray-50 border-r border-gray-200 text-right pr-3 pl-2 py-4 font-mono shrink-0"
          style={{ fontSize, lineHeight, color: lineNumberColor }}
        >
          {lines.map((_, index) => {
            const diff = diffLines?.[index];
            const isAdded = diff?.type === "added";
            const isRemoved = diff?.type === "removed";
            
            let bgColor = "transparent";
            let textColor = lineNumberColor;
            let prefix = "";

            if (isAdded) {
              bgColor = addedLineColor;
              textColor = "#1a7f37";
              prefix = "+";
            } else if (isRemoved) {
              bgColor = removedLineColor;
              textColor = "#cf222e";
              prefix = "-";
            }

            return (
              <div
                key={index}
                className="flex items-center justify-end"
                style={{ height: lineHeight, backgroundColor: bgColor, color: textColor }}
              >
                <span className="mr-2 font-semibold">{prefix}</span>
                <span className="min-w-[1.5em]">{index + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Cột Code */}
        <div className="flex-1 relative py-4">
          <SyntaxHighlighter
            language={language}
            style={themeMap[theme]}
            showLineNumbers={false}
            wrapLines={true}
            wrapLongLines={false}
            customStyle={{
              margin: 0,
              padding: 0,
              backgroundColor: "transparent",
              fontSize,
              lineHeight,
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
            }}
            codeTagProps={{
              style: {
                fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize,
                lineHeight,
              },
            }}
            lineProps={(lineNumber) => {
              const diff = diffLines?.[lineNumber - 1];
              let bg = "transparent";
              if (diff?.type === "added") bg = addedLineColor;
              if (diff?.type === "removed") bg = removedLineColor;
              
              return { 
                style: { 
                  backgroundColor: bg, 
                  display: "block", 
                  width: "100%",
                  paddingRight: "12px"
                } 
              };
            }}
          >
            {code}
          </SyntaxHighlighter>

          {/* Diff Markers bên phải */}
          {showDiffMarkers && diffLines && (
            <div
              className="absolute top-4 right-0 h-[calc(100%-2rem)] w-1.5 flex flex-col pointer-events-none"
            >
              {diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className="w-full flex-shrink-0"
                  style={{
                    height: lineHeight,
                    backgroundColor:
                      line.type === "added"
                        ? addedMarkerColor
                        : line.type === "removed"
                        ? removedMarkerColor
                        : "transparent",
                    opacity: line.type === "none" ? 0 : 0.7,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;