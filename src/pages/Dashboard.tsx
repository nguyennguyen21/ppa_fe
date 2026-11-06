import { Link } from "react-router-dom";
import { FaArrowRight, FaClock, FaCodeCompare, FaUpload } from "react-icons/fa6";
import { mockSubmissions, recentActivity, type Submission } from "../data/mock";
import { pairRelations } from "../data/pairRelations";
import InfoCard from "../modules/lib/Components/UI/cart/InfoCard";
import ClustersCard from "../modules/lib/Components/UI/cart/ClustersCard";
import SubmissionsList from "../modules/lib/Components/UI/list/submitlist";
import ExportButtons from "../modules/plagiarism/components/ExportButtons";
import { exportExcel, exportPdf, nowLabel, safeFileName } from "../modules/plagiarism/utils/export";

const levelDot: Record<string, string> = {
  high: "bg-red-600",
  warn: "bg-amber-500",
  ok: "bg-emerald-600",
};

const labelName = (label: Submission["label"]) =>
  label === "plagiarism" ? "Cần xem lại" : label === "suspicious" ? "Nghi ngờ" : "Không có dấu hiệu";

export default function Dashboard() {
  const plag = mockSubmissions.filter((s) => s.label === "plagiarism").length;
  const suspicious = mockSubmissions.filter((s) => s.label === "suspicious").length;
  const innocent = mockSubmissions.filter((s) => s.label === "innocent").length;
  const highest = Math.max(...mockSubmissions.map((s) => s.similarity));
  const average = Math.round(mockSubmissions.reduce((a, s) => a + s.similarity, 0) / mockSubmissions.length);
  const sorted = [...mockSubmissions].sort((a, b) => b.similarity - a.similarity);

  const handleExcel = async () => {
    await exportExcel(safeFileName("codex-bao-cao-tong-quan", "xlsx"), [
      {
        name: "Tong quan",
        columns: [
          { header: "Chỉ số", key: "k", width: 28 },
          { header: "Giá trị", key: "v", width: 34 },
        ],
        rows: [
          { k: "Tổng bài nộp", v: mockSubmissions.length },
          { k: "Cần xem lại", v: plag },
          { k: "Nghi ngờ", v: suspicious },
          { k: "Không có dấu hiệu", v: innocent },
          { k: "Tương đồng trung bình (%)", v: average },
          { k: "Tương đồng cao nhất (%)", v: highest },
          { k: "Số cặp tương đồng", v: pairRelations.length },
          { k: "Xuất lúc", v: nowLabel() },
        ],
      },
      {
        name: "Bai nop",
        columns: [
          { header: "STT", key: "stt", width: 6 },
          { header: "Tệp", key: "file", width: 14 },
          { header: "Sinh viên", key: "student", width: 24 },
          { header: "Mã SV", key: "studentCode", width: 14 },
          { header: "Lớp", key: "className", width: 10 },
          { header: "Ngôn ngữ", key: "language", width: 11 },
          { header: "Trạng thái", key: "status", width: 18 },
          { header: "Tương đồng (%)", key: "similarity", width: 15 },
          { header: "Ngày nộp", key: "uploadedAt", width: 12 },
          { header: "Kích thước", key: "size", width: 11 },
        ],
        rows: sorted.map((s, i) => ({
          stt: i + 1,
          file: s.fileName,
          student: s.studentName,
          studentCode: s.studentCode,
          className: s.className,
          language: s.language,
          status: labelName(s.label),
          similarity: s.similarity,
          uploadedAt: s.uploadedAt,
          size: s.size,
        })),
      },
      {
        name: "Cap tuong dong",
        columns: [
          { header: "STT", key: "stt", width: 6 },
          { header: "Bài A", key: "aName", width: 14 },
          { header: "Sinh viên A", key: "aStudent", width: 24 },
          { header: "Bài B", key: "bName", width: 14 },
          { header: "Sinh viên B", key: "bStudent", width: 24 },
          { header: "Tương đồng (%)", key: "similarity", width: 15 },
        ],
        rows: pairRelations.map((p, i) => ({
          stt: i + 1,
          aName: p.aName,
          aStudent: p.aStudent,
          bName: p.bName,
          bStudent: p.bStudent,
          similarity: p.similarity,
        })),
      },
    ]);
  };

  const handlePdf = () => {
    const ok = exportPdf({
      fileName: safeFileName("codex-bao-cao-tong-quan", "pdf"),
      title: "Báo cáo tổng quan đợt quét đạo văn",
      subtitle: "Tổng hợp kết quả quét và các cặp bài có mức tương đồng cao.",
      meta: [
        { label: "Phạm vi", value: `${mockSubmissions.length} bài nộp` },
        { label: "Ngưỡng cảnh báo", value: "≥ 80% tương đồng" },
      ],
      summary: [
        { label: "Tổng bài nộp", value: `${mockSubmissions.length}` },
        { label: "Cần xem lại", value: `${plag}`, tone: "danger" },
        { label: "Nghi ngờ", value: `${suspicious}`, tone: "warn" },
        { label: "Không dấu hiệu", value: `${innocent}`, tone: "ok" },
        { label: "Tương đồng TB", value: `${average}%` },
        { label: "Cao nhất", value: `${highest}%` },
      ],
      tables: [
        {
          title: "Các cặp bài tương đồng cao",
          columns: ["STT", "Bài A", "Sinh viên A", "Bài B", "Sinh viên B", "Tương đồng"],
          align: ["right", "left", "left", "left", "left", "right"],
          rows: pairRelations.map((p, i) => [
            String(i + 1),
            p.aName,
            p.aStudent,
            p.bName,
            p.bStudent,
            `${p.similarity}%`,
          ]),
          note: "Sắp xếp theo mức tương đồng giảm dần.",
        },
        {
          title: "Danh sách bài nộp",
          columns: ["STT", "Tệp", "Sinh viên", "Mã SV", "Lớp", "Tương đồng", "Trạng thái"],
          align: ["right", "left", "left", "left", "left", "right", "left"],
          rows: sorted.map((s, i) => [
            String(i + 1),
            s.fileName,
            s.studentName,
            s.studentCode,
            s.className,
            `${s.similarity}%`,
            labelName(s.label),
          ]),
        },
      ],
      footerNote: "CODEX · Báo cáo tổng quan đợt quét",
    });

    if (!ok) {
      window.alert("Trình duyệt đã chặn cửa sổ in. Hãy cho phép popup của trang rồi thử lại.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">CODEX / Tổng quan</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">Tổng quan đợt quét</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-500">
            Theo dõi số bài nộp, mức tương đồng cao nhất và các nhóm bài cần xem lại trước khi chấm.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons onExcel={handleExcel} onPdf={handlePdf} />
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            <FaUpload /> Nạp bài nộp
          </Link>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <FaCodeCompare /> So sánh
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Tổng bài nộp" value={mockSubmissions.length} valueSuffix="bài" icon={<span className="font-serif text-3xl font-semibold text-stone-900">{mockSubmissions.length}</span>} iconBgColor="bg-white" valueColor="text-stone-900" showLink={false} />
        <InfoCard title="Cần xem lại" value={plag} valueSuffix="bài" icon={<span className="font-serif text-3xl font-semibold text-red-700">{plag}</span>} iconBgColor="bg-white" valueColor="text-red-700" showLink={false} />
        <InfoCard title="Tương đồng cao nhất" value={highest} valueSuffix="%" icon={<span className="font-serif text-3xl font-semibold text-stone-900">{highest}%</span>} iconBgColor="bg-white" valueColor="text-stone-900" showLink={false} />
        <InfoCard title="Sinh viên" value={48} valueSuffix="người" icon={<span className="font-serif text-3xl font-semibold text-stone-900">48</span>} iconBgColor="bg-white" valueColor="text-stone-900" showLink={false} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SubmissionsList
            submissions={mockSubmissions.map((s) => ({ id: s.id, fileName: s.fileName, label: s.label, similarity: s.similarity }))}
            maxDisplayItems={6}
            plagiarismColor="text-red-700"
            innocentColor="text-stone-700"
            cardBgColor="bg-white"
            onViewAllClick={() => {}}
          />
        </div>
        <div className="space-y-6">
          <ClustersCard
            clusters={[{ id: "1", count: 5 }, { id: "2", count: 3 }, { id: "3", count: 2 }, { id: "4", count: 1 }]}
            maxDisplayClusters={4}
            cardBgColor="bg-white"
            clusterBgColor="bg-stone-900"
          />
          <div className="border border-stone-200 bg-white p-5" style={{ borderRadius: 10 }}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <FaClock className="text-stone-400" /> Hoạt động gần đây
            </h3>
            <ul className="mt-4 space-y-4">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${levelDot[a.level]}`} />
                  <span>
                    <span className="block leading-relaxed text-stone-700">{a.text}</span>
                    <span className="mt-0.5 block text-xs text-stone-400">{a.time}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/upload", title: "Nạp bài nộp mới", desc: "Tải lên file, thư mục hoặc zip để chạy một đợt quét." },
          { to: "/ai-detect", title: "Phân loại AI / người viết", desc: "Chấm 34 chỉ số tĩnh để phát hiện dấu hiệu code do AI sinh." },
          { to: "/compare", title: "So sánh hai đoạn code", desc: "Đối chiếu trực tiếp và xem chỗ giống, chỗ khác." },
          { to: "/results", title: "Xem kết quả chi tiết", desc: "Lọc theo nhãn, tìm kiếm và sắp xếp theo mức tương đồng." },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="group border border-stone-200 bg-white p-5 transition hover:border-stone-300" style={{ borderRadius: 10 }}>
            <h3 className="font-semibold text-stone-900">{c.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{c.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-900">
              Mở <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
