
import "./App.css";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";

import { fallbackRoutes } from "./router/fallback/fallback";
import { publicRoutes } from "./router/public/public";
import { privateRoutes } from "./router/private/private";

import PublicLayout from "./modules/lib/Components/layouts/PublicLayout";
import PrivateLayout from "./modules/lib/Components/layouts/PrivateLayout";
import SharedLayout from "./modules/lib/Components/layouts/SharedLayout";

function App() {
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

  return useRoutes(allRoutes);
}

export default App;
