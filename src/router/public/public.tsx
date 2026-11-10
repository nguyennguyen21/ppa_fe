/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import Dashboard from "../../pages/Dashboard";

const UploadPage = lazy(() => import("../../pages/UploadPage"));
const ResultsPage = lazy(() => import("../../pages/ResultsPage"));
const ComparePage = lazy(() => import("../../pages/ComparePage"));
const RelationsPage = lazy(() => import("../../pages/RelationsPage"));
const DetectPage = lazy(() => import("../../pages/DetectPage"));
const AiDetectLandingPage = lazy(() => import("../../pages/AiDetectLandingPage"));
const AiSampleLibraryPage = lazy(() => import("../../pages/AiSampleLibraryPage"));
const AiClusterPage = lazy(() => import("../../pages/AiClusterPage"));
const ProfilePage = lazy(() => import("../../pages/ProfilePage"));

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
  { path: "/profile", element: <ProfilePage /> },
];
