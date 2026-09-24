import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  TrendingUp,
  Wallet,
  Star,
  Tag,
  Settings,

} from "lucide-react";
import logo from "../../assets/images/logo.png";

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

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-[274px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="flex h-[110px] items-center justify-center border-b border-gray-200">
        <img src={logo} alt="VedaCrafts" className="h-14 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            end={path === "/"}
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
        ))}
      </nav>
    </aside>
  );
}
