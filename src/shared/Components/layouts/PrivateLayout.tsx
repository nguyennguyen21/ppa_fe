
import { Outlet } from "react-router-dom";
import Navbar from "../UI/navbar/Navbar";

const PrivateLayout = () => {
  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <Navbar>
        <Outlet />
      </Navbar>
    </div>
  );
};

export default PrivateLayout;
