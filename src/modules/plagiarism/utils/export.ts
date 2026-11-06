// ---------------------------------------------------------------------------
// Xuất dữ liệu: Excel thật (.xlsx) và báo cáo PDF (khổ A4, in từ trình duyệt).
// - Excel dùng SheetJS, nạp động nên không làm nặng bundle chính.
// - PDF tạo một cửa sổ báo cáo đã dựng sẵn bố cục in; trình duyệt tự mở hộp
//   thoại in, người dùng chọn "Lưu thành PDF". Cách này giữ đúng tiếng Việt
//   và không cần nhúng font vào bundle.
// ---------------------------------------------------------------------------

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string | number | null | undefined>>;
}

/** Tạo file .xlsx với nhiều sheet. */
export async function exportExcel(fileName: string, sheets: ExportSheet[]) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const header = sheet.columns.map((c) => c.header);
    const body = sheet.rows.map((row) =>
      sheet.columns.map((c) => {
        const v = row[c.key];
        return v === null || v === undefined ? "" : v;
      }),
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    ws["!cols"] = sheet.columns.map((c) => ({
      wch: c.width ?? Math.min(60, Math.max(12, c.header.length + 2)),
    }));
    if (body.length > 0) {
      ws["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: body.length, c: sheet.columns.length - 1 },
        }),
      };
    }
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, fileName);
}

export interface ReportMeta {
  label: string;
  value: string;
}

export interface ReportSummary {
  label: string;
  value: string;
  tone?: "neutral" | "danger" | "warn" | "ok";
}

export interface ReportTable {
  title?: string;
  columns: string[];
  rows: string[][];
  align?: Array<"left" | "right" | "center">;
  note?: string;
}

export interface ReportOptions {
  /** Dùng làm tiêu đề cửa sổ => tên file PDF gợi ý. */
  fileName: string;
  title: string;
  subtitle?: string;
  meta?: ReportMeta[];
  summary?: ReportSummary[];
  tables: ReportTable[];
  footerNote?: string;
}

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

const toneColor: Record<NonNullable<ReportSummary["tone"]>, string> = {
  neutral: "#1c1917",
  danger: "#b91c1c",
  warn: "#b45309",
  ok: "#15803d",
};

function buildTable(table: ReportTable): string {
  const align = table.align ?? [];
  const head = table.columns
    .map((c, i) => `<th style="text-align:${align[i] ?? "left"}">${esc(c)}</th>`)
    .join("");
  const body = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, i) =>
              `<td style="text-align:${align[i] ?? "left"}">${esc(String(cell ?? ""))}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  return `
    <section class="block">
      ${table.title ? `<h2>${esc(table.title)}</h2>` : ""}
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body || `<tr><td colspan="${table.columns.length}" class="empty">Không có dữ liệu</td></tr>`}</tbody>
      </table>
      ${table.note ? `<p class="note">${esc(table.note)}</p>` : ""}
    </section>`;
}

function buildReportHtml(opts: ReportOptions): string {
  const now = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  const meta = (opts.meta ?? [])
    .map((m) => `<div><dt>${esc(m.label)}</dt><dd>${esc(m.value)}</dd></div>`)
    .join("");

  const summary = (opts.summary ?? [])
    .map(
      (s) => `
      <div class="stat">
        <span class="stat-label">${esc(s.label)}</span>
        <span class="stat-value" style="color:${toneColor[s.tone ?? "neutral"]}">${esc(s.value)}</span>
      </div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${esc(opts.fileName)}</title>
  <style>
    @page { size: A4; margin: 14mm 12mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1c1917;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.5;
      background: #fff;
    }
    .toolbar {
      position: sticky; top: 0; z-index: 5;
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 10px 0; background: #fff; border-bottom: 1px solid #e7e5e4;
    }
    .toolbar button {
      font: inherit; font-weight: 600; cursor: pointer;
      border: 1px solid #d6d3d1; border-radius: 6px;
      background: #fff; color: #1c1917; padding: 7px 14px;
    }
    .toolbar button.primary { background: #1c1917; border-color: #1c1917; color: #fff; }
    .doc { padding-top: 14px; }
    .brand {
      display: flex; justify-content: space-between; align-items: baseline;
      border-bottom: 2px solid #1c1917; padding-bottom: 8px; margin-bottom: 14px;
    }
    .brand strong { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; }
    .brand span { color: #78716c; font-size: 10px; }
    h1 { font-family: Georgia, "Times New Roman", serif; font-size: 21px; margin: 0 0 4px; }
    .subtitle { color: #57534e; margin: 0 0 14px; }
    dl.meta { display: flex; flex-wrap: wrap; gap: 6px 26px; margin: 0 0 14px; }
    dl.meta div { display: flex; gap: 6px; }
    dl.meta dt { color: #78716c; }
    dl.meta dd { margin: 0; font-weight: 600; }
    .stats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .stat {
      border: 1px solid #e7e5e4; border-radius: 8px;
      padding: 8px 14px; min-width: 120px;
    }
    .stat-label { display: block; color: #78716c; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; }
    .stat-value { font-size: 17px; font-weight: 700; }
    .block { margin-bottom: 16px; }
    h2 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 13px; margin: 0 0 6px;
      padding-bottom: 4px; border-bottom: 1px solid #e7e5e4;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #f5f5f4; font-size: 9px; text-transform: uppercase;
      letter-spacing: 0.05em; color: #44403c;
      padding: 6px 8px; border-bottom: 1px solid #d6d3d1;
    }
    td { padding: 6px 8px; border-bottom: 1px solid #e7e5e4; vertical-align: top; }
    td.code { font-family: "Cascadia Mono", Consolas, monospace; font-size: 9.5px; white-space: pre-wrap; word-break: break-word; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
    .empty { text-align: center; color: #a8a29e; padding: 18px; }
    .note { color: #78716c; font-size: 9px; margin: 6px 0 0; }
    footer {
      margin-top: 18px; padding-top: 8px; border-top: 1px solid #e7e5e4;
      display: flex; justify-content: space-between;
      color: #a8a29e; font-size: 9px;
    }
    @media print {
      .toolbar { display: none; }
      .doc { padding-top: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">In lại</button>
    <button class="primary" onclick="window.print()">Lưu thành PDF</button>
  </div>
  <div class="doc">
    <div class="brand">
      <strong>CODEX</strong>
      <span>Hệ thống chống đạo văn học thuật</span>
    </div>
    <h1>${esc(opts.title)}</h1>
    ${opts.subtitle ? `<p class="subtitle">${esc(opts.subtitle)}</p>` : ""}
    ${meta ? `<dl class="meta">${meta}</dl>` : ""}
    ${summary ? `<div class="stats">${summary}</div>` : ""}
    ${opts.tables.map(buildTable).join("")}
    <footer>
      <span>${esc(opts.footerNote ?? "Báo cáo do CODEX tạo tự động.")}</span>
      <span>Xuất lúc ${esc(now)}</span>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Mở báo cáo và gọi hộp thoại in (người dùng chọn "Lưu thành PDF").
 * Phải gọi trực tiếp trong sự kiện click để không bị chặn popup.
 */
export function exportPdf(opts: ReportOptions): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;

  win.document.open();
  win.document.write(buildReportHtml(opts));
  win.document.close();
  win.focus();
  win.setTimeout(() => win.print(), 350);
  return true;
}

/** Tên file an toàn cho Windows/macOS. */
export function safeFileName(base: string, ext: string): string {
  const cleaned = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${cleaned || "codex-report"}.${ext}`;
}

export const nowLabel = () =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
