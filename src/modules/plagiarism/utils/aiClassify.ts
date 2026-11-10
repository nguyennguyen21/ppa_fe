// ---------------------------------------------------------------------------
// Phân loại code AI / người viết bằng 34 chỉ số tĩnh.
//
// Cách làm: trích xuất các chỉ số từ mã nguồn (không cần AST đầy đủ), so sánh
// với xu hướng thường gặp của code do AI sinh và code sinh viên viết tay, rồi
// cộng điểm có trọng số. Đây là mô hình heuristic minh hoạ — không thay thế
// công cụ phát hiện AI chuyên dụng.
// ---------------------------------------------------------------------------

export type CodeLanguage =
  | "c"
  | "cpp"
  | "java"
  | "python"
  | "javascript"
  | "typescript"
  | "unknown";

export const languageLabel: Record<CodeLanguage, string> = {
  c: "C",
  cpp: "C++",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  unknown: "Không xác định",
};

export type MetricFormat = "int" | "percent" | "decimal";

export interface MetricDef {
  key: string;
  label: string;
  desc: string;
  format: MetricFormat;
}

export interface MetricGroup {
  id: string;
  title: string;
  subtitle: string;
  items: MetricDef[];
}

export const METRIC_GROUPS: MetricGroup[] = [
  {
    id: "code",
    title: "Chỉ số mã nguồn",
    subtitle: "Đo lường cơ bản",
    items: [
      {
        key: "interpolatedStringCount",
        label: "Số chuỗi nội suy",
        desc: "Đếm chuỗi nội suy xuất hiện trong mã, ví dụ ${name} hoặc f\"{name}\".",
        format: "int",
      },
      {
        key: "statementCount",
        label: "Số câu lệnh",
        desc: "Đếm tổng số câu lệnh có nghĩa trong mã nguồn.",
        format: "int",
      },
      {
        key: "lineCount",
        label: "Số dòng mã",
        desc: "Số dòng chứa mã nguồn thực tế, không tính dòng trống.",
        format: "int",
      },
      {
        key: "totalLines",
        label: "Tổng số dòng",
        desc: "Tổng số dòng của tệp, gồm mã, dòng trống và chú thích.",
        format: "int",
      },
      {
        key: "nonWhitespaceLines",
        label: "Dòng không trống",
        desc: "Số dòng không rỗng, gồm cả mã nguồn và chú thích.",
        format: "int",
      },
      {
        key: "functionCount",
        label: "Số hàm",
        desc: "Tổng số hàm/phương thức được khai báo.",
        format: "int",
      },
      {
        key: "variableCount",
        label: "Số biến",
        desc: "Tổng số biến được khai báo.",
        format: "int",
      },
      {
        key: "parameterCount",
        label: "Số tham số",
        desc: "Tổng số tham số của tất cả hàm trong mã nguồn.",
        format: "int",
      },
      {
        key: "loopCount",
        label: "Số vòng lặp",
        desc: "Số vòng lặp for, while, do–while.",
        format: "int",
      },
      {
        key: "conditionalCount",
        label: "Số điều kiện",
        desc: "Số cấu trúc điều kiện như if, else if, switch, case.",
        format: "int",
      },
      {
        key: "averageLineLength",
        label: "Độ dài dòng TB",
        desc: "Tổng số ký tự của các dòng mã chia cho số dòng mã.",
        format: "decimal",
      },
      {
        key: "blankLineRatio",
        label: "Tỉ lệ dòng trống",
        desc: "Số dòng trống chia cho tổng số dòng mã nguồn.",
        format: "percent",
      },
    ],
  },
  {
    id: "structure",
    title: "Cấu trúc mã",
    subtitle: "Bố cục và luồng điều khiển",
    items: [
      {
        key: "namespaceCount",
        label: "Số namespace",
        desc: "Số namespace/package được khai báo.",
        format: "int",
      },
      {
        key: "expressionStatementCount",
        label: "Số câu lệnh biểu thức",
        desc: "Số câu lệnh biểu thức như phép gán, gọi hàm, tăng/giảm biến.",
        format: "int",
      },
      {
        key: "functionLength",
        label: "Độ dài hàm TB",
        desc: "Độ dài trung bình của các hàm (theo số dòng).",
        format: "decimal",
      },
      {
        key: "maxFunctionLength",
        label: "Hàm dài nhất",
        desc: "Độ dài của hàm dài nhất trong mã nguồn.",
        format: "int",
      },
      {
        key: "nestingDepth",
        label: "Độ lồng TB",
        desc: "Độ sâu lồng nhau trung bình của if, for, while, switch.",
        format: "decimal",
      },
      {
        key: "maxNestingDepth",
        label: "Độ lồng lớn nhất",
        desc: "Độ sâu lồng nhau lớn nhất trong mã nguồn.",
        format: "int",
      },
      {
        key: "returnStatementCount",
        label: "Số lệnh return",
        desc: "Tổng số câu lệnh return.",
        format: "int",
      },
      {
        key: "classCount",
        label: "Số lớp / struct",
        desc: "Tổng số lớp/struct được khai báo.",
        format: "int",
      },
      {
        key: "controlStructureCount",
        label: "Số cấu trúc điều khiển",
        desc: "Tổng số cấu trúc điều khiển: if, else, for, while, switch, case.",
        format: "int",
      },
      {
        key: "indentationConsistency",
        label: "Độ nhất quán thụt lề",
        desc: "Tỉ lệ dòng sử dụng đúng hệ thống thụt lề của tệp.",
        format: "percent",
      },
    ],
  },
  {
    id: "naming",
    title: "Quy ước đặt tên",
    subtitle: "Tính nhất quán",
    items: [
      {
        key: "functionNamingConsistency",
        label: "Nhất quán tên hàm",
        desc: "Tỉ lệ hàm dùng cùng một kiểu đặt tên.",
        format: "percent",
      },
      {
        key: "variableNamingConsistency",
        label: "Nhất quán tên biến",
        desc: "Tỉ lệ biến dùng cùng một kiểu đặt tên.",
        format: "percent",
      },
      {
        key: "classNamingConsistency",
        label: "Nhất quán tên lớp",
        desc: "Tỉ lệ lớp dùng cùng một kiểu đặt tên.",
        format: "percent",
      },
      {
        key: "constantNamingConsistency",
        label: "Nhất quán tên hằng",
        desc: "Tỉ lệ hằng số dùng cùng một kiểu đặt tên.",
        format: "percent",
      },
    ],
  },
  {
    id: "readability",
    title: "Độ dễ đọc",
    subtitle: "Chú thích và tên gọi",
    items: [
      {
        key: "commentRatio",
        label: "Tỉ lệ chú thích",
        desc: "Số dòng chú thích chia cho tổng số dòng mã nguồn.",
        format: "percent",
      },
      {
        key: "commentCount",
        label: "Số chú thích",
        desc: "Số dòng hoặc khối chú thích trong mã nguồn.",
        format: "int",
      },
      {
        key: "functionNameLength",
        label: "Độ dài tên hàm TB",
        desc: "Độ dài trung bình của tên hàm theo số ký tự.",
        format: "decimal",
      },
      {
        key: "variableNameLength",
        label: "Độ dài tên biến TB",
        desc: "Độ dài trung bình của tên biến theo số ký tự.",
        format: "decimal",
      },
    ],
  },
  {
    id: "formatting",
    title: "Định dạng",
    subtitle: "Khoảng trắng và thụt lề",
    items: [
      {
        key: "whitespaceRatio",
        label: "Tỉ lệ khoảng trắng",
        desc: "Tỉ lệ ký tự khoảng trắng trên tổng số ký tự của mã nguồn.",
        format: "percent",
      },
    ],
  },
  {
    id: "complexity",
    title: "Độ phức tạp",
    subtitle: "Số nhánh quyết định",
    items: [
      {
        key: "cyclomaticComplexity",
        label: "Độ phức tạp cyclomatic",
        desc: "Số nhánh quyết định: if, for, while, case, &&, ||, catch…",
        format: "int",
      },
      {
        key: "averageCyclomaticComplexity",
        label: "Độ phức tạp TB",
        desc: "Tổng độ phức tạp chia cho số hàm.",
        format: "decimal",
      },
    ],
  },
  {
    id: "identifier",
    title: "Định danh",
    subtitle: "Tên duy nhất trong mã",
    items: [
      {
        key: "uniqueIdentifierCount",
        label: "Số định danh duy nhất",
        desc: "Số lượng định danh khác nhau trong mã nguồn.",
        format: "int",
      },
    ],
  },
];

export interface Signal {
  key: string;
  label: string;
  detail: string;
  /** > 0 nghiêng về AI, < 0 nghiêng về người viết. */
  weight: number;
}

export type Verdict = "ai" | "human" | "unclear";

export interface AnalysisResult {
  language: CodeLanguage;
  metrics: Record<string, number>;
  functionCount: number;
  codeLineCount: number;
  aiProbability: number;
  humanProbability: number;
  verdict: Verdict;
  confidence: number;
  /** Tổng điểm thô trước khi chuẩn hoá (dương = AI, âm = người viết). */
  rawScore: number;
  signals: Signal[];
  notes: string[];
}

const KEYWORDS = new Set([
  "if", "else", "for", "while", "do", "switch", "case", "default", "break",
  "continue", "return", "try", "catch", "finally", "throw", "new", "delete",
  "class", "struct", "interface", "enum", "typedef", "namespace", "using",
  "public", "private", "protected", "static", "final", "abstract", "synchronized",
  "const", "constexpr", "let", "var", "function", "def", "async", "await",
  "import", "from", "package", "export", "yield", "sizeof", "this", "self",
  "super", "extends", "implements", "void", "int", "float", "double", "char",
  "long", "short", "bool", "boolean", "byte", "string", "String", "auto",
  "unsigned", "signed", "true", "false", "null", "undefined", "None", "True",
  "False", "in", "is", "not", "and", "or", "lambda", "with", "as", "pass",
  "global", "nonlocal", "assert", "del", "raise", "elif", "except", "print",
  "printf", "scanf", "include", "define", "main", "std", "cout", "cin",
]);

const STRING_RE = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g;

const stripStrings = (text: string) => text.replace(STRING_RE, '""');

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

interface LineInfo {
  text: string;
  blank: boolean;
  comment: boolean;
  code: boolean;
}

function classifyLines(lines: string[], lang: CodeLanguage): LineInfo[] {
  const infos: LineInfo[] = [];
  let inBlockComment = false;
  let pythonDocMarker: string | null = null;

  for (const text of lines) {
    const trimmed = text.trim();
    let comment = false;

    if (lang === "python") {
      if (pythonDocMarker) {
        comment = true;
        if (trimmed.includes(pythonDocMarker)) pythonDocMarker = null;
      } else if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        comment = true;
        const marker = trimmed.slice(0, 3);
        if (!trimmed.slice(3).includes(marker)) pythonDocMarker = marker;
      } else if (trimmed.startsWith("#")) {
        comment = true;
      }
    } else {
      if (inBlockComment) {
        comment = true;
        if (trimmed.includes("*/")) inBlockComment = false;
      } else if (trimmed.startsWith("/*")) {
        comment = true;
        if (!trimmed.slice(2).includes("*/")) inBlockComment = true;
      } else if (trimmed.startsWith("//")) {
        comment = true;
      }
    }

    infos.push({
      text,
      blank: trimmed === "",
      comment,
      code: !comment && trimmed !== "" && !/^[{}();,]+$/.test(trimmed),
    });
  }

  return infos;
}

export function detectLanguage(code: string): CodeLanguage {
  const source = code.trim();
  if (!source) return "unknown";

  if (/^\s*#\s*include\b/m.test(source) || /\b(?:printf|scanf)\s*\(/.test(source)) {
    if (/\b(?:std::|iostream|using\s+namespace\s+std|cout\s*<<|vector\s*<)/.test(source)) {
      return "cpp";
    }
    return "c";
  }
  if (
    /\b(?:public|private|protected)\s+(?:static\s+)?(?:void|class|int|String)\b/.test(source) ||
    /\bSystem\.out\.print/.test(source) ||
    /^\s*import\s+java\./m.test(source)
  ) {
    return "java";
  }
  if (
    /^\s*(?:async\s+)?def\s+\w+\s*\(/m.test(source) ||
    /^\s*from\s+\w+\s+import\b/m.test(source) ||
    /^\s*import\s+\w+\s*$/m.test(source) ||
    /^\s*@\w+/m.test(source)
  ) {
    return "python";
  }
  if (
    /:\s*(?:string|number|boolean|void|unknown|any)\b/.test(source) ||
    /\binterface\s+\w+\s*\{/.test(source) ||
    /\btype\s+\w+\s*=/.test(source)
  ) {
    return "typescript";
  }
  if (/\b(?:function|const|let|var)\b|=>/.test(source)) return "javascript";
  return "unknown";
}

interface ExtractedFunction {
  name: string;
  start: number;
  end: number;
  params: string;
}

const countParams = (params: string) => {
  const trimmed = params.trim();
  if (!trimmed || trimmed === "void") return 0;
  let depth = 0;
  let count = 1;
  for (const ch of trimmed) {
    if ("<([{".includes(ch)) depth += 1;
    else if (">)]}".includes(ch)) depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) count += 1;
  }
  return count;
};

function findFunctions(lines: LineInfo[], lang: CodeLanguage): ExtractedFunction[] {
  const functions: ExtractedFunction[] = [];
  const seen = new Set<number>();
  const isBraceLanguage = lang !== "python";

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].text;
    if (lines[i].blank || lines[i].comment) continue;

    let name = "";
    let params = "";

    if (lang === "python") {
      const match = raw.match(
        /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\((.*?)\)\s*(?:->.*?)?:/,
      );
      if (!match) continue;
      name = match[1];
      params = match[2];
    } else if (isBraceLanguage) {
      const structural = stripStrings(raw);
      if (!structural.includes("(")) continue;

      const method = structural.match(
        /^\s*(?:(?:public|private|protected|static|final|abstract|synchronized|native|inline|virtual|extern|async|export|default)\s+)*(?:[\w:<>[\],*&?.]+\s+)+([A-Za-z_$][\w$]*)\s*\((.*?)\)\s*(?:const\s*)?(?:throws\s+[\w, ]+)?\s*\{?\s*$/,
      );
      const fn = structural.match(
        /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\((.*?)\)\s*\{?\s*$/,
      );
      const arrow = structural.match(
        /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>/,
      );
      const match = method ?? fn ?? arrow;
      if (!match) continue;
      name = match[1];
      params = match[2];
    }

    if (!name || KEYWORDS.has(name) || seen.has(i)) continue;
    seen.add(i);

    let end = i;
    if (lang === "python") {
      const baseIndent = (raw.match(/^[\t ]*/)?.[0].length ?? 0);
      for (let j = i + 1; j < lines.length; j += 1) {
        if (lines[j].blank) {
          end = j;
          continue;
        }
        const indent = lines[j].text.match(/^[\t ]*/)?.[0].length ?? 0;
        if (indent <= baseIndent && !lines[j].text.trim().startsWith("#")) break;
        end = j;
      }
    } else {
      let depth = 0;
      let opened = false;
      for (let j = i; j < lines.length; j += 1) {
        const text = stripStrings(lines[j].text);
        for (const ch of text) {
          if (ch === "{") {
            depth += 1;
            opened = true;
          } else if (ch === "}") {
            depth -= 1;
          }
        }
        end = j;
        if (opened && depth <= 0) break;
      }
      if (!opened) end = Math.min(i + 1, lines.length - 1);
    }

    functions.push({ name, start: i, end, params });
  }

  return functions;
}

type NameStyle = "constant" | "pascal" | "camel" | "snake" | "lower" | "other";

function styleOf(name: string): NameStyle {
  if (/^[A-Z][A-Z0-9_]*$/.test(name) && name !== name.toLowerCase()) return "constant";
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return "pascal";
  if (/^[a-z][a-zA-Z0-9]*$/.test(name) && /[A-Z]/.test(name)) return "camel";
  if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(name)) return "snake";
  if (/^[a-z][a-z0-9]*$/.test(name)) return "lower";
  return "other";
}

function namingConsistency(names: string[]): number {
  if (names.length < 2) return 1;
  const counts = new Map<NameStyle, number>();
  for (const name of names) {
    const style = styleOf(name);
    counts.set(style, (counts.get(style) ?? 0) + 1);
  }
  return clamp01(Math.max(...counts.values()) / names.length);
}

function collectVariableNames(code: string, lang: CodeLanguage, functions: Set<string>): string[] {
  const names = new Set<string>();
  const add = (name: string | undefined) => {
    if (!name || KEYWORDS.has(name) || functions.has(name)) return;
    names.add(name);
  };

  if (lang === "python") {
    for (const match of code.matchAll(/^\s*([a-z_]\w*)\s*=(?!=)/gm)) add(match[1]);
    for (const match of code.matchAll(/\bfor\s+([a-z_]\w*)\s+in\b/g)) add(match[1]);
  } else {
    for (const match of code.matchAll(/\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)/g)) add(match[1]);
    for (const match of code.matchAll(
      /\b(?:int|float|double|char|long|short|bool|boolean|byte|String|string|auto|unsigned|signed)\s+([A-Za-z_]\w*)\s*(?:\[|=|;|,|\))/g,
    )) {
      add(match[1]);
    }
    for (const match of code.matchAll(
      /\b(?:[A-Z]\w*(?:<[^>]+>)?)\s+([a-z_]\w*)\s*(?:\[|=|;|,|\))/g,
    )) {
      add(match[1]);
    }
  }

  return [...names];
}

function collectConstantNames(code: string): string[] {
  const names = new Set<string>();
  for (const match of code.matchAll(/#define\s+([A-Za-z_]\w*)/g)) {
    if (/^[A-Z][A-Z0-9_]*$/.test(match[1])) names.add(match[1]);
  }
  for (const match of code.matchAll(
    /\b(?:const|final|static\s+final)\s+(?:[A-Za-z_]\w*(?:<[^>]+>)?\s+)?([A-Z][A-Z0-9_]{2,})\b/g,
  )) {
    names.add(match[1]);
  }
  return [...names];
}

function collectClassNames(code: string): string[] {
  const names = new Set<string>();
  for (const match of code.matchAll(
    /\b(?:class|struct|interface|enum)\s+([A-Za-z_]\w*)/g,
  )) {
    names.add(match[1]);
  }
  return [...names];
}

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

/** Độ nhất quán thụt lề: so độ sâu thực tế với độ sâu ngoặc (hoặc indent Python). */
function indentationConsistency(
  infos: LineInfo[],
  lang: CodeLanguage,
): { consistency: number; averageDepth: number; maxDepth: number } {
  const indented = infos.filter((l) => !l.blank && /^[\t ]+/.test(l.text));
  const hasTabs = indented.some((l) => l.text.startsWith("\t"));
  const hasSpaces = indented.some((l) => /^ +/.test(l.text));
  const mixed = hasTabs && hasSpaces;

  if (lang === "python" || lang === "unknown") {
    const widths = indented.map((l) => l.text.match(/^[\t ]*/)?.[0].length ?? 0);
    const unit = widths.some((w) => w > 0 && w % 4 === 0) ? 4 : 2;
    const aligned = widths.filter((w) => w % unit === 0).length;
    const ratio = widths.length ? aligned / widths.length : 1;
    const depths = widths.map((w) => w / unit);
    return {
      consistency: clamp01(mixed ? ratio * 0.4 : ratio),
      averageDepth: average(depths),
      maxDepth: depths.length ? Math.max(...depths) : 0,
    };
  }

  let depth = 0;
  let error = 0;
  let count = 0;
  let depthSum = 0;
  let maxDepth = 0;

  for (const info of infos) {
    if (info.blank) continue;
    const structural = stripStrings(info.text);
    const leading = structural.match(/^[\t ]*/)?.[0] ?? "";
    const actualLevel = leading.includes("\t")
      ? (leading.match(/\t/g)?.length ?? 0)
      : Math.floor(leading.length / 4);

    if (info.code) {
      error += Math.min(3, Math.abs(actualLevel - depth));
      count += 1;
      depthSum += depth;
      maxDepth = Math.max(maxDepth, depth);
    }

    for (const ch of structural) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth = Math.max(0, depth - 1);
    }
  }

  const consistency = count ? 1 - error / (count * 3) : 1;
  return {
    consistency: clamp01(mixed ? consistency * 0.4 : consistency),
    averageDepth: count ? depthSum / count : 0,
    maxDepth,
  };
}

function addSignal(
  signals: Signal[],
  key: string,
  label: string,
  detail: string,
  weight: number,
) {
  if (Math.abs(weight) < 0.05) return;
  signals.push({ key, label, detail, weight: Number(weight.toFixed(2)) });
}

export function analyzeCode(source: string): AnalysisResult {
  const normalized = source.replace(/\r\n?/g, "\n");
  const language = detectLanguage(normalized);
  const rawLines = normalized.split("\n");
  const totalLines = normalized.trim() === "" ? 0 : rawLines.length;
  const infos = classifyLines(rawLines, language);

  // Không có mã: trả về hồ sơ rỗng thay vì chấm điểm từ các chỉ số bằng 0.
  if (totalLines === 0) {
    const emptyMetrics: Record<string, number> = {};
    for (const group of METRIC_GROUPS) {
      for (const item of group.items) emptyMetrics[item.key] = 0;
    }
    return {
      language: "unknown",
      metrics: emptyMetrics,
      functionCount: 0,
      codeLineCount: 0,
      aiProbability: 0.5,
      humanProbability: 0.5,
      verdict: "unclear",
      confidence: 0,
      rawScore: 0,
      signals: [],
      notes: ["Chưa có mã nguồn để phân tích."],
    };
  }

  const nonBlankInfos = infos.filter((l) => !l.blank);
  const codeInfos = infos.filter((l) => l.code);
  const codeOnly = codeInfos.map((l) => l.text).join("\n");
  const structural = stripStrings(codeOnly);
  const commentCount = infos.filter((l) => l.comment).length;
  const functions = findFunctions(infos, language);
  const functionNames = functions.map((f) => f.name);
  const functionNameSet = new Set(functionNames);
  const variableNames = collectVariableNames(structural, language, functionNameSet);
  const constantNames = collectConstantNames(codeOnly);
  const classNames = collectClassNames(codeOnly);

  const nonBlankCount = nonBlankInfos.length;
  const totalChars = rawLines.reduce((sum, line) => sum + line.length, 0);
  const whitespaceChars = rawLines.reduce(
    (sum, line) => sum + (line.match(/\s/g)?.length ?? 0),
    0,
  );
  const trailingWhitespace = infos.filter(
    (l) => !l.blank && /\s$/.test(l.text),
  ).length;

  const statementCount =
    language === "python"
      ? codeInfos.filter(
          (l) => !/^\s*(?:else|elif|except|finally)\s*:?\s*$/.test(l.text),
        ).length
      : Math.max(
          0,
          (structural.match(/;/g)?.length ?? 0) -
            2 * (structural.match(/\bfor\s*\(/g)?.length ?? 0),
        );

  const loopCount =
    (structural.match(/\bfor\b|\bwhile\b|\bdo\s*\{/g)?.length ?? 0);
  const conditionalCount =
    (structural.match(/\bif\b|\bswitch\b|\bcase\b/g)?.length ?? 0);
  const controlStructureCount =
    (structural.match(/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bswitch\b|\bcase\b|\btry\b|\bcatch\b|\bdo\b/g)?.length ?? 0);
  const returnStatementCount = (structural.match(/\breturn\b/g)?.length ?? 0);
  const namespaceCount =
    (structural.match(/\bnamespace\b|\bpackage\b/g)?.length ?? 0);
  const classCount =
    (structural.match(/\bclass\b|\bstruct\b|\binterface\b|\benum\b/g)?.length ?? 0);

  const expressionStatementCount = codeInfos.reduce((count, line) => {
    const text = stripStrings(line.text).trim();
    if (!text) return count;
    if (
      /^(?:if|for|while|switch|case|return|class|struct|enum|typedef|import|package|namespace|using|public|private|protected|static|final|const|let|var|function|def|async|void|int|float|double|char|long|short|bool|boolean|String|string|auto|unsigned|signed|else|try|catch|finally)\b/.test(
        text,
      )
    ) {
      return count;
    }
    return /[=(]/.test(text) ? count + 1 : count;
  }, 0);

  const interpolatedStringCount =
    (normalized.match(/\$\{[^}]*\}/g)?.length ?? 0) +
    (normalized.match(/\b(?:f|rf|fr)["'][^"'\n]*\{[^}\n]+\}[^"'\n]*["']/g)?.length ?? 0);

  const uniqueIdentifiers = new Set(structural.match(/[A-Za-z_$][\w$]*/g) ?? []);
  for (const keyword of KEYWORDS) uniqueIdentifiers.delete(keyword);

  const naming = indentationConsistency(infos, language);

  const allNames = [...new Set([
    ...functionNames,
    ...variableNames,
    ...classNames,
    ...constantNames,
  ])];
  const descriptiveRatio = allNames.length
    ? allNames.filter((name) => name.length >= 4).length / allNames.length
    : 0;
  const averageVariableNameLength = average(variableNames.map((n) => n.length));
  const averageFunctionNameLength = average(functionNames.map((n) => n.length));
  const averageFunctionLength = average(
    functions.map((f) => f.end - f.start + 1),
  );
  const maxFunctionLength = functions.length
    ? Math.max(...functions.map((f) => f.end - f.start + 1))
    : 0;

  const functionComplexities = functions.map((f) => {
    const body = stripStrings(
      infos.slice(f.start, f.end + 1).map((l) => l.text).join("\n"),
    );
    return (
      1 +
      (body.match(/\bif\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|&&|\|\||\?/g)?.length ?? 0)
    );
  });
  const totalComplexity = functions.length
    ? functionComplexities.reduce((a, b) => a + b, 0)
    : 1 + (structural.match(/\bif\b|\bfor\b|\bwhile\b|\bcase\b|&&|\|\|/g)?.length ?? 0);
  const averageComplexity = totalComplexity / Math.max(1, functions.length);

  const functionNamingConsistency = namingConsistency(functionNames);
  const variableNamingConsistency = namingConsistency(variableNames);
  const classNamingConsistency = namingConsistency(classNames);
  const constantNamingConsistency = namingConsistency(constantNames);
  const namingScore = average([
    functionNamingConsistency,
    variableNamingConsistency,
  ]);

  const hasDocstring =
    language === "python"
      ? /"""[\s\S]*?"""|'''[\s\S]*?'''/.test(normalized)
      : /\/\*\*[\s\S]*?\*\//.test(normalized);

  const hasTypeHints =
    language === "python"
      ? /\bdef\s+\w+\s*\([^)]*:[^)]*\)|->\s*[\w[\], ]+:/.test(normalized)
      : language === "typescript"
        ? /:\s*(?:string|number|boolean|void|unknown|any|[A-Z]\w*)\b/.test(normalized)
        : false;

  const commentRatio = totalLines ? commentCount / totalLines : 0;
  const blankLineRatio = totalLines
    ? (totalLines - nonBlankCount) / totalLines
    : 0;
  const averageLineLength = nonBlankCount
    ? totalChars / nonBlankCount
    : 0;
  const whitespaceRatio = totalChars ? whitespaceChars / totalChars : 0;

  const metrics: Record<string, number> = {
    interpolatedStringCount,
    statementCount,
    lineCount: nonBlankCount,
    totalLines,
    nonWhitespaceLines: nonBlankCount,
    functionCount: functions.length,
    variableCount: variableNames.length,
    parameterCount: functions.reduce((sum, f) => sum + countParams(f.params), 0),
    loopCount,
    conditionalCount,
    averageLineLength,
    blankLineRatio,
    namespaceCount,
    expressionStatementCount,
    functionLength: averageFunctionLength,
    maxFunctionLength,
    nestingDepth: naming.averageDepth,
    maxNestingDepth: naming.maxDepth,
    returnStatementCount,
    classCount,
    controlStructureCount,
    indentationConsistency: naming.consistency,
    functionNamingConsistency,
    variableNamingConsistency,
    classNamingConsistency,
    constantNamingConsistency,
    commentRatio,
    commentCount,
    functionNameLength: averageFunctionNameLength,
    variableNameLength: averageVariableNameLength,
    whitespaceRatio,
    cyclomaticComplexity: totalComplexity,
    averageCyclomaticComplexity: averageComplexity,
    uniqueIdentifierCount: uniqueIdentifiers.size,
  };

  // -------------------------------------------------------------------------
  // Chấm điểm: dương = dấu hiệu AI, âm = dấu hiệu người viết.
  // -------------------------------------------------------------------------
  const signals: Signal[] = [];
  const pct = (value: number) => `${Math.round(value * 100)}%`;

  if (commentRatio >= 0.15) {
    addSignal(
      signals,
      "commentRatio",
      "Mật độ chú thích cao",
      `${commentCount}/${totalLines} dòng là chú thích (${pct(commentRatio)}).`,
      0.8,
    );
  } else if (commentRatio >= 0.06) {
    addSignal(
      signals,
      "commentRatio",
      "Có chú thích",
      `${pct(commentRatio)} dòng là chú thích.`,
      0.25,
    );
  } else if (commentRatio === 0 && totalLines >= 8) {
    addSignal(
      signals,
      "commentRatio",
      "Không có chú thích",
      `${totalLines} dòng mã nhưng không có dòng chú thích nào.`,
      -0.8,
    );
  } else if (commentRatio <= 0.03) {
    addSignal(
      signals,
      "commentRatio",
      "Rất ít chú thích",
      `Chỉ ${pct(commentRatio)} dòng là chú thích.`,
      -0.35,
    );
  }

  if (hasDocstring) {
    addSignal(
      signals,
      "docstring",
      "Docstring / JSDoc mô tả",
      "Có khối mô tả đầu hàm hoặc lớp — kiểu chú thích AI thường sinh.",
      0.55,
    );
  }

  if (descriptiveRatio >= 0.8) {
    addSignal(
      signals,
      "descriptiveNames",
      "Tên định danh mô tả",
      `${pct(descriptiveRatio)} định danh dài từ 4 ký tự trở lên.`,
      0.65,
    );
  } else if (descriptiveRatio >= 0.62) {
    addSignal(
      signals,
      "descriptiveNames",
      "Tên định danh khá rõ",
      `${pct(descriptiveRatio)} định danh dài từ 4 ký tự trở lên.`,
      0.25,
    );
  } else if (descriptiveRatio <= 0.35) {
    addSignal(
      signals,
      "descriptiveNames",
      "Tên định danh ngắn",
      `Chỉ ${pct(descriptiveRatio)} định danh dài từ 4 ký tự; còn lại là tên rất ngắn.`,
      -0.75,
    );
  } else if (descriptiveRatio <= 0.55) {
    addSignal(
      signals,
      "descriptiveNames",
      "Nhiều tên viết tắt",
      `${pct(descriptiveRatio)} định danh dài từ 4 ký tự trở lên.`,
      -0.35,
    );
  }

  if (averageVariableNameLength >= 7) {
    addSignal(
      signals,
      "variableNameLength",
      "Tên biến dài, mô tả",
      `Trung bình ${averageVariableNameLength.toFixed(1)} ký tự/tên biến.`,
      0.3,
    );
  } else if (averageVariableNameLength > 0 && averageVariableNameLength <= 3) {
    addSignal(
      signals,
      "variableNameLength",
      "Tên biến rất ngắn",
      `Trung bình ${averageVariableNameLength.toFixed(1)} ký tự/tên biến (i, n, a…).`,
      -0.55,
    );
  } else if (averageVariableNameLength > 0 && averageVariableNameLength <= 4.5) {
    addSignal(
      signals,
      "variableNameLength",
      "Tên biến ngắn",
      `Trung bình ${averageVariableNameLength.toFixed(1)} ký tự/tên biến.`,
      -0.25,
    );
  }

  if (namingScore >= 0.9) {
    addSignal(
      signals,
      "namingConsistency",
      "Quy ước đặt tên nhất quán",
      `Hàm và biến cùng kiểu đặt tên (${pct(namingScore)}).`,
      0.3,
    );
  } else if (namingScore <= 0.6) {
    addSignal(
      signals,
      "namingConsistency",
      "Đặt tên thiếu nhất quán",
      `Chỉ ${pct(namingScore)} tên theo cùng một quy ước.`,
      -0.3,
    );
  }

  if (naming.consistency >= 0.9) {
    addSignal(
      signals,
      "indentation",
      "Thụt lề đều",
      `Độ nhất quán thụt lề ${pct(naming.consistency)}.`,
      0.25,
    );
  } else if (naming.consistency <= 0.65) {
    addSignal(
      signals,
      "indentation",
      "Thụt lề lệch",
      `Độ nhất quán thụt lề chỉ ${pct(naming.consistency)}.`,
      -0.5,
    );
  }

  if (blankLineRatio >= 0.1 && blankLineRatio <= 0.3) {
    addSignal(
      signals,
      "blankLines",
      "Có khoảng thở giữa các khối",
      `${pct(blankLineRatio)} dòng là dòng trống.`,
      0.2,
    );
  } else if (blankLineRatio === 0 && totalLines >= 15) {
    addSignal(
      signals,
      "blankLines",
      "Không có dòng trống",
      `${totalLines} dòng liên tục, không có dòng ngăn khối.`,
      -0.2,
    );
  }

  if (hasTypeHints) {
    addSignal(
      signals,
      "typeHints",
      "Có khai báo kiểu dữ liệu",
      "Hàm/biến được chú thích kiểu — dấu hiệu thường gặp ở code AI.",
      0.35,
    );
  }

  if (naming.maxDepth >= 4) {
    addSignal(
      signals,
      "nesting",
      "Lồng nhau sâu",
      `Độ sâu tối đa ${naming.maxDepth} cấp.`,
      -0.35,
    );
  }

  if (averageFunctionLength >= 45) {
    addSignal(
      signals,
      "functionLength",
      "Hàm quá dài",
      `Trung bình ${averageFunctionLength.toFixed(0)} dòng/hàm.`,
      -0.3,
    );
  }

  if (averageComplexity >= 8) {
    addSignal(
      signals,
      "complexity",
      "Độ phức tạp cao",
      `Trung bình ${averageComplexity.toFixed(1)} nhánh/hàm.`,
      -0.2,
    );
  }

  if (averageLineLength > 110) {
    addSignal(
      signals,
      "lineLength",
      "Dòng quá dài",
      `Trung bình ${averageLineLength.toFixed(0)} ký tự/dòng.`,
      -0.4,
    );
  } else if (averageLineLength > 0 && averageLineLength < 18) {
    addSignal(
      signals,
      "lineLength",
      "Dòng rất ngắn",
      `Trung bình ${averageLineLength.toFixed(0)} ký tự/dòng.`,
      -0.2,
    );
  } else if (averageLineLength >= 40 && averageLineLength <= 90) {
    addSignal(
      signals,
      "lineLength",
      "Độ dài dòng vừa phải",
      `Trung bình ${averageLineLength.toFixed(0)} ký tự/dòng.`,
      0.15,
    );
  }

  const trailingRatio = nonBlankCount
    ? trailingWhitespace / nonBlankCount
    : 0;
  if (trailingRatio >= 0.1) {
    addSignal(
      signals,
      "trailingWhitespace",
      "Khoảng trắng cuối dòng",
      `${pct(trailingRatio)} dòng có khoảng trắng thừa ở cuối.`,
      -0.25,
    );
  }

  const hasTabs = codeInfos.some((l) => l.text.startsWith("\t"));
  const hasSpaces = codeInfos.some((l) => /^ +/.test(l.text));
  if (hasTabs && hasSpaces) {
    addSignal(
      signals,
      "mixedIndent",
      "Trộn tab và dấu cách",
      "Không thống nhất ký tự thụt lề trong cùng tệp.",
      -0.35,
    );
  }

  const rawScore = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const shortPenalty = totalLines > 0 && totalLines < 12 ? 0.45 : 1;
  const scaledScore = rawScore * shortPenalty;
  const aiProbability = 1 / (1 + Math.exp(-1.35 * scaledScore));
  const humanProbability = 1 - aiProbability;

  let verdict: Verdict = "unclear";
  if (aiProbability >= 0.65) verdict = "ai";
  else if (aiProbability <= 0.35) verdict = "human";

  const confidence = verdict === "ai"
    ? aiProbability
    : verdict === "human"
      ? humanProbability
      : Math.abs(aiProbability - 0.5) * 2;

  const notes: string[] = [];
  if (totalLines === 0) {
    notes.push("Chưa có mã nguồn để phân tích.");
  } else if (totalLines < 12) {
    notes.push("Đoạn mã khá ngắn nên độ tin cậy được giảm bớt.");
  }
  if (functions.length === 0 && totalLines > 0) {
    notes.push("Không nhận diện được hàm nào; một số chỉ số cấu trúc có thể bằng 0.");
  }
  if (language === "unknown" && totalLines > 0) {
    notes.push("Chưa nhận diện được ngôn ngữ; một số chỉ số được tính theo quy tắc chung.");
  }

  return {
    language,
    metrics,
    functionCount: functions.length,
    codeLineCount: codeInfos.length,
    aiProbability,
    humanProbability,
    verdict,
    confidence,
    rawScore: scaledScore,
    signals: signals.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    notes,
  };
}

/** Hiển thị giá trị chỉ số theo đúng định dạng. */
export function formatMetric(value: number, format: MetricFormat): string {
  if (!Number.isFinite(value)) return "—";
  if (format === "percent") return `${Math.round(value * 100)}%`;
  if (format === "decimal") return value.toFixed(1);
  return `${Math.round(value)}`;
}

// ---------------------------------------------------------------------------
// Giải thích ở mức dòng: nhấn vào một dòng trong khung mã để xem vì sao dòng
// đó nghiêng về AI hay người viết. Kết quả chỉ dựa trên cú pháp và cách đặt
// tên của chính dòng đó (cộng thêm vài quy tắc định dạng), không phải phán
// quyết chắc chắn.
// ---------------------------------------------------------------------------

export interface LineSignal {
  label: string;
  /** > 0 nghiêng AI, < 0 nghiêng người viết. */
  weight: number;
  detail: string;
}

export interface LineInsight {
  line: number;
  type: string;
  tone: "ai" | "human" | "neutral";
  summary: string;
  signals: LineSignal[];
}

const lineIdentifiers = (line: string): string[] => {
  const withoutStrings = line.replace(STRING_RE, '""');
  return (withoutStrings.match(/[A-Za-z_$][\w$]*/g) ?? []).filter(
    (token) => !KEYWORDS.has(token),
  );
};

const detectLineType = (line: string, lang: CodeLanguage): string => {
  const trimmed = line.trim();
  if (!trimmed) return "Dòng trống";
  if (isCommentLine(line, lang)) return "Chú thích / docstring";
  if (/^(?:import|from|#include|using|package|require)\b/.test(trimmed)) {
    return "Import / phụ thuộc";
  }
  if (/^(?:export\s+)?(?:class|struct|interface|enum)\b/.test(trimmed)) {
    return "Khai báo lớp";
  }
  if (
    /^\s*(?:async\s+)?def\s+\w+\s*\(/.test(trimmed) ||
    /^\s*(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(/.test(trimmed) ||
    /^\s*(?:(?:public|private|protected|static|final|abstract|inline|virtual|extern|async|export)\s+)*(?:[\w:<>[\],*&?.]+\s+)+[A-Za-z_$][\w$]*\s*\([^;{}]*\)\s*(?:const\s*)?\{?\s*$/.test(
      trimmed,
    )
  ) {
    return "Khai báo hàm";
  }
  if (/^(?:if|else|for|while|switch|case|try|catch|except|finally|do)\b/.test(trimmed)) {
    return "Cấu trúc điều khiển";
  }
  if (/^return\b/.test(trimmed)) return "Câu lệnh return";
  if (
    /^(?:const|let|var|int|float|double|char|long|short|bool|boolean|String|string|auto|unsigned|signed)\b/.test(
      trimmed,
    ) ||
    /^(?:self\.)?[A-Za-z_]\w*\s*(?::|=)/.test(trimmed)
  ) {
    return "Khai báo / gán biến";
  }
  return "Câu lệnh";
};

const isCommentLine = (line: string, lang: CodeLanguage): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (lang === "python") {
    return (
      trimmed.startsWith("#") ||
      trimmed.startsWith('"""') ||
      trimmed.startsWith("'''")
    );
  }
  if (/^#\s*(?:include|define|if|ifdef|ifndef|endif|pragma|undef|error|line)\b/.test(trimmed)) {
    return false;
  }
  return trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*");
};

const isDocLine = (line: string, lang: CodeLanguage): boolean => {
  const trimmed = line.trim();
  if (lang === "python") {
    return trimmed.startsWith('"""') || trimmed.startsWith("'''");
  }
  return trimmed.startsWith("/**") || trimmed.startsWith("*");
};

const extractFunctionName = (line: string): string | null => {
  const def = line.match(/\bdef\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (def) return def[1];
  const fn = line.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (fn) return fn[1];
  const brace = line.match(
    /([A-Za-z_$][\w$]*)\s*\([^;{}]*\)\s*(?:const\s*)?\{?\s*$/,
  );
  return brace ? brace[1] : null;
};

export function analyzeLine(
  rawLine: string,
  language: CodeLanguage,
  lineNumber: number,
): LineInsight {
  const trimmed = rawLine.trim();
  const signals: LineSignal[] = [];
  const push = (label: string, weight: number, detail: string) => {
    if (Math.abs(weight) < 0.05) return;
    signals.push({ label, weight, detail });
  };

  const type = detectLineType(rawLine, language);

  if (!trimmed) {
    return {
      line: lineNumber,
      type,
      tone: "neutral",
      summary:
        "Dòng trống không mang nội dung nên không được tính vào điểm phân loại. Nó chỉ ảnh hưởng đến tỉ lệ dòng trống của cả tệp.",
      signals,
    };
  }

  const comment = isCommentLine(rawLine, language);
  const doc = comment && isDocLine(rawLine, language);

  if (comment) {
    push(
      doc ? "Docstring / mô tả" : "Chú thích",
      doc ? 0.5 : 0.3,
      doc
        ? "Đây là khối mô tả đầu hàm/lớp — kiểu chú thích mà AI thường sinh ra khi viết code."
        : "Dòng chú thích giải thích mục đích của code. AI có xu hướng chú thích dày và đều hơn người viết tay.",
    );
  }

  const hasTypeHint =
    /\bdef\s+\w+\s*\([^)]*:[^)]*\)/.test(rawLine) ||
    /->\s*[\w[\], |.]+:?\s*$/.test(trimmed) ||
    /\b(?:const|let|var)\s+\w+\s*:\s*[A-Za-z_[\]]/.test(rawLine) ||
    /^\s*(?:self\.)?[A-Za-z_]\w*\s*:\s*(?:int|float|str|bool|list|dict|string|number|boolean|void|[A-Z]\w*)/.test(
      rawLine,
    );

  if (hasTypeHint) {
    push(
      "Khai báo kiểu dữ liệu",
      0.35,
      "Dòng có type hint/annotation. AI thường chú thích kiểu đầy đủ; code viết tay của sinh viên hay bỏ qua phần này.",
    );
  }

  const identifiers = lineIdentifiers(rawLine);
  const longIdentifiers = [...new Set(identifiers.filter((name) => name.length >= 8))];
  const singleLetterIdentifiers = [
    ...new Set(identifiers.filter((name) => name.length === 1)),
  ];

  if (longIdentifiers.length >= 2) {
    push(
      "Định danh dài, mô tả",
      0.35,
      `Các tên như ${longIdentifiers.slice(0, 3).join(", ")} đủ dài để đọc hiểu mà không cần chú thích — cách đặt tên thường thấy ở code AI.`,
    );
  } else if (longIdentifiers.length === 1) {
    push(
      "Định danh mô tả",
      0.2,
      `Định danh "${longIdentifiers[0]}" dài và mô tả, nghiêng về cách đặt tên có chủ đích.`,
    );
  }

  if (singleLetterIdentifiers.length >= 2) {
    push(
      "Biến một ký tự",
      -0.35,
      `Dòng dùng ${singleLetterIdentifiers.join(", ")} làm tên biến. Các tên một ký tự như i, j, n thường xuất hiện khi viết tay nhanh.`,
    );
  } else if (
    singleLetterIdentifiers.length === 1 &&
    /^(?:int|float|double|char|long|short|bool|boolean|str|var|let|const)\s/i.test(
      trimmed,
    )
  ) {
    push(
      "Tên biến ngắn",
      -0.2,
      `Biến "${singleLetterIdentifiers[0]}" chỉ một ký tự, thiếu mô tả so với code do AI sinh.`,
    );
  }

  const functionName = extractFunctionName(trimmed);
  if (functionName) {
    if (functionName.length >= 10) {
      push(
        "Tên hàm mô tả",
        0.25,
        `Tên hàm "${functionName}" dài và nói rõ việc nó làm — đặc điểm thường gặp ở code AI.`,
      );
    } else if (functionName.length <= 4) {
      push(
        "Tên hàm ngắn",
        -0.2,
        `Tên hàm "${functionName}" rất ngắn; code viết tay thường dùng tên kiểu này để nhanh.`,
      );
    }
    if (/^[a-z]+(?:_[a-z0-9]+)+$/.test(functionName)) {
      push(
        "snake_case nhất quán",
        0.15,
        `Tên hàm "${functionName}" theo snake_case rõ ràng, thường gặp trong code có quy ước.`,
      );
    }
  }

  if (
    /\)\{/.test(rawLine) ||
    (/[A-Za-z0-9_]\s*[=<>!]=?\s*[A-Za-z0-9_"]/.test(rawLine) &&
      !/[=<>!]\s|\s[=<>!]/.test(rawLine))
  ) {
    push(
      "Viết liền, thiếu khoảng trắng",
      -0.2,
      "Không có khoảng trắng quanh toán tử hoặc trước dấu ngoặc — kiểu viết nhanh, ít chăm chút định dạng.",
    );
  }

  const magicNumbers = trimmed.match(/\b(?!0\b|1\b|2\b)\d{2,}\b/g);
  if (
    magicNumbers &&
    !comment &&
    !/^\s*(?:const|final|#define|enum)\b/.test(trimmed)
  ) {
    push(
      "Số literal không đặt tên",
      -0.1,
      `Dùng số ${magicNumbers[0]} trực tiếp trong biểu thức thay vì hằng số có tên — dấu hiệu viết tay khá phổ biến.`,
    );
  }

  if (/\s$/.test(rawLine)) {
    push(
      "Khoảng trắng cuối dòng",
      -0.2,
      "Dòng có khoảng trắng thừa ở cuối — lỗi định dạng nhỏ thường bị bỏ qua khi viết tay.",
    );
  }

  if (/^\t/.test(rawLine)) {
    push(
      "Thụt lề bằng tab",
      -0.15,
      "Dòng bắt đầu bằng tab, dễ trộn với dấu cách trong cùng tệp.",
    );
  }

  if (rawLine.length > 110) {
    push(
      "Dòng quá dài",
      -0.2,
      `Dòng dài ${rawLine.length} ký tự, khó đọc và ít được AI trình bày theo cách này.`,
    );
  }

  if (/^\s*(?:try|except|catch|finally)\b/.test(trimmed)) {
    push(
      "Xử lý lỗi rõ ràng",
      0.15,
      "Có khối bắt lỗi tường minh — AI thường thêm xử lý ngoại lệ dù bài toán đơn giản.",
    );
  }

  const total = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const tone: LineInsight["tone"] =
    total >= 0.3 ? "ai" : total <= -0.3 ? "human" : "neutral";

  const top = [...signals]
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 2);

  let summary = "Dòng này không có dấu hiệu đủ mạnh để nghiêng hẳn về một phía.";
  if (top.length > 0) {
    summary = top.map((signal) => signal.detail).join(" ");
    if (tone === "ai") {
      summary += " Tổng hợp lại, dòng này nghiêng về code do AI sinh.";
    } else if (tone === "human") {
      summary += " Tổng hợp lại, dòng này nghiêng về cách viết tay.";
    } else {
      summary += " Các tín hiệu đang cân bằng nên chưa đủ kết luận cho riêng dòng này.";
    }
  }

  return {
    line: lineNumber,
    type,
    tone,
    summary,
    signals: signals.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
  };
}
