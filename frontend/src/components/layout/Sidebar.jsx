// import { NavLink } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Package,
//   ShoppingCart,
//   TrendingUp,
//   Wallet,
//   Star,
//   Tag,
//   Settings,

// } from "lucide-react";
// import logo from "../../assets/images/logo-transparent.png";

// const navItems = [
//   { label: "Dashboard", icon: LayoutDashboard, path: "/" },
//   { label: "Products", icon: Package, path: "/products" },
//   { label: "Orders", icon: ShoppingCart, path: "/orders" },
//   // { label: "Inventory", icon: Boxes, path: "/inventory" },
//   { label: "Insights", icon: TrendingUp, path: "/insights" },
//   { label: "Earnings", icon: Wallet, path: "/earnings" },
//   { label: "Reviews", icon: Star, path: "/reviews" },
//   { label: "Coupons", icon: Tag, path: "/coupons" },
//   { label: "Settings", icon: Settings, path: "/settings" },
  
// ];

// export default function Sidebar() {
//   return (
//     <aside className="fixed top-0 left-0 h-screen w-[274px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
//       {/* Logo */}
//       <div className="flex h-[110px] items-center justify-center border-b border-gray-200">
//         <img src={logo} alt="VedaCrafts" className="h-14 w-auto" />
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 px-3 py-4 space-y-1">
//         {navItems.map(({ label, icon: Icon, path }) => (
//           <NavLink
//             key={label}
//             to={path}
//             end={path === "/"}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
//                 isActive
//                   ? "bg-emerald-50 text-emerald-700"
//                   : "text-gray-600 hover:bg-gray-50"
//               }`
//             }
//           >
//             <Icon size={18} />
//             <span>{label}</span>
//           </NavLink>
//         ))}
//       </nav>
//     </aside>
//   );
// }

import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Star,
  Tag,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
import logo from "../../assets/images/logo-transparent.png";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Orders", icon: ShoppingCart, path: "/orders" },
  // { label: "Inventory", icon: Boxes, path: "/inventory" },
  { label: "Insights", icon: TrendingUp, path: "/insights" },
  { label: "Earnings", icon: Wallet, path: "/earnings" },
  { label: "Reviews", icon: Star, path: "/reviews" },
  { label: "Coupons", icon: Tag, path: "/coupons" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSettingsActive = location.pathname.startsWith("/settings");
  const [settingsOpenOverride, setSettingsOpenOverride] = useState(null);
  const settingsOpen = settingsOpenOverride ?? isSettingsActive;
  return (
    <>
      {/* Backdrop, mobile only, shown while sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-[274px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-[110px] items-center justify-between border-b border-gray-200 px-4">
          <img src={logo} alt="VedaCrafts" className="h-14 w-auto" />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, icon: Icon, path }) =>
            label === "Settings" ? (
              <div key={label}>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settingsOpen;
                    setSettingsOpenOverride(next);
                    if (next && !isSettingsActive) {
                      navigate("/settings/profile");
                    }
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isSettingsActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{label}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      settingsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {settingsOpen && (
                  <div className="ml-7 mt-1 space-y-1">
                    <NavLink
                      to="/settings/profile"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-gray-500 hover:bg-gray-50"
                        }`
                      }
                    >
                      Profile
                    </NavLink>
                    <NavLink
                      to="/settings/documents"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-gray-500 hover:bg-gray-50"
                        }`
                      }
                    >
                      Documents
                    </NavLink>
                    <NavLink
                      to="/settings/business-information"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-gray-500 hover:bg-gray-50"
                        }`
                      }
                    >
                      Business Information
                    </NavLink>
                    <NavLink
                      to="/settings/bank-details"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-gray-500 hover:bg-gray-50"
                        }`
                      }
                    >
                      Bank Details
                    </NavLink>
                    <NavLink
                      to="/settings/selling-location"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-gray-500 hover:bg-gray-50"
                        }`
                      }
                    >
                      Selling Location
                    </NavLink>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={label}
                to={path}
                end={path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>
    </>
  );
}