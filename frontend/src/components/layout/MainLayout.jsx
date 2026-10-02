// import { Outlet } from "react-router-dom";
// import Sidebar from "./Sidebar";
// import Header from "./Header";

// export default function MainLayout() {
//   return (
//     <div className="flex">
//       <Sidebar />
//       <div className="flex-1 flex flex-col min-h-screen ml-[274px]">
//         <Header sellerName="Priya" />
//         <main className="flex-1 bg-white px-9 py-4">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[274px]">
        <Header sellerName="Priya" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 bg-white px-4 py-4 sm:px-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}