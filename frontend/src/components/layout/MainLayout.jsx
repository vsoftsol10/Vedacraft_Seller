import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-[274px]">
        <Header sellerName="Priya" />
        <main className="flex-1 bg-white px-9 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
