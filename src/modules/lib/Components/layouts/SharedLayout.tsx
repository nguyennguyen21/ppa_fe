
import { Outlet } from "react-router-dom";

const SharedLayout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
};

export default SharedLayout;
