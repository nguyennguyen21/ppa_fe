
import { Suspense, useEffect, useState } from "react";
import { Navigate, useLocation, useRoutes, type RouteObject } from "react-router-dom";

import { fallbackRoutes } from "./router/fallback/fallback";
import { publicRoutes } from "./router/public/public";
import { privateRoutes } from "./router/private/private";

import PublicLayout from "./modules/lib/Components/layouts/PublicLayout";
import PrivateLayout from "./modules/lib/Components/layouts/PrivateLayout";
import SharedLayout from "./modules/lib/Components/layouts/SharedLayout";
import Seo from "./modules/lib/Components/Seo";
import RouteSkeleton from "./modules/lib/Components/UI/feedback/RouteSkeleton";

function App() {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [transitioning, setTransitioning] = useState(false);

  // Hiện skeleton ngắn mỗi khi đổi route để người dùng không cảm thấy bấm nút không phản hồi.
  // Điều chỉnh state trong quá trình render khi pathname đổi (không setState đồng bộ trong effect).
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setTransitioning(true);
  }

  useEffect(() => {
    if (!transitioning) return;
    const id = window.setTimeout(() => setTransitioning(false), 320);
    return () => window.clearTimeout(id);
  }, [transitioning]);

  const allRoutes: RouteObject[] = [
    { path: "/", element: <Navigate to="/upload" replace /> },
    {
      element: <PublicLayout />,
      children: publicRoutes.map((route) => ({
        path: route.path,
        element: route.element,
      })),
    },
    {
      element: <PrivateLayout />,
      children: privateRoutes.map((route) => ({
        path: route.path,
        element: route.element,
      })),
    },
    {
      element: <SharedLayout />,
      children: fallbackRoutes.map((route) => ({
        path: route.path,
        element: route.element,
      })),
    },
  ];

  const element = useRoutes(allRoutes);

  return (
    <>
      <Seo />
      {/* Progress bar chuyển trang */}
      {transitioning && (
        <div
          key={location.pathname}
          className="route-progress fixed left-0 right-0 top-0 z-[80] h-0.5 bg-stone-900 dark:bg-amber-400"
          role="progressbar"
          aria-label="Đang chuyển trang"
        />
      )}
      <Suspense fallback={<RouteSkeleton />}>
        <div aria-busy={transitioning} className="relative">
          {element}
          {/* Lớp skeleton phủ trong lúc chuyển trang — giữ nội dung lazy đã mount để tránh tháo gỡ. */}
          {transitioning && (
            <div
              className="pointer-events-none absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] dark:bg-[#0f0f0e]/80"
              aria-hidden="true"
            >
              <RouteSkeleton />
            </div>
          )}
        </div>
      </Suspense>
    </>
  );
}

export default App;
