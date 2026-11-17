
import { Outlet } from "react-router-dom";

const SharedLayout = () => {
  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <Outlet />
    </div>
  );
};

export default SharedLayout;
