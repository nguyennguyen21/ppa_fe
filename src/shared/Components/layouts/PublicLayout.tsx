
import { Outlet } from "react-router-dom";
import Navbar from "../UI/navbar/Navbar";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <Navbar>
        <Outlet />
      </Navbar>
    </div>
  );
};

export default PublicLayout;
