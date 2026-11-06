
import UploadPage from "../../pages/UploadPage";
import Dashboard from "../../pages/Dashboard";
import ResultsPage from "../../pages/ResultsPage";
import ComparePage from "../../pages/ComparePage";
import RelationsPage from "../../pages/RelationsPage";
import DetectPage from "../../pages/DetectPage";
import AiDetectLandingPage from "../../pages/AiDetectLandingPage";
import AiSampleLibraryPage from "../../pages/AiSampleLibraryPage";
import AiClusterPage from "../../pages/AiClusterPage";

export const publicRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/upload", element: <UploadPage /> },
  { path: "/results", element: <ResultsPage /> },
  { path: "/ai-detect", element: <AiDetectLandingPage /> },
  { path: "/ai-detect/kho-mau", element: <AiSampleLibraryPage /> },
  { path: "/ai-detect/cum", element: <AiClusterPage /> },
  { path: "/ai-detect/analyze", element: <DetectPage /> },
  { path: "/compare", element: <ComparePage /> },
  { path: "/relations", element: <RelationsPage /> },
  {
    path: "/profile",
    element: (
      <div className="border border-stone-200 bg-white p-8">
        <h2 className="font-serif text-xl text-stone-900">Trang cá nhân</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Quản lý thông tin giảng viên và lịch sử quét.
        </p>
      </div>
    ),
  },
];
