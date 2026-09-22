import { useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Boxes,
  LineChart,
  Wallet,
  Star,
  Ticket,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";
import Products from "./pages/Products";
import Dashboard from "./pages/Dashboard"
import AddProduct from "./components/products/Addproduct";
import Orders from "./pages/Order"
import Login from "./pages/Login";

const navItemClass = "mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[#444] no-underline hover:bg-surface-hover";
const activeNavItemClass = "bg-[#e4f4e2] font-semibold text-nav-active";
const settingsSubnavButtonClass = "cursor-pointer rounded-[6px] border-0 bg-transparent px-2.5 py-[7px] text-left text-xs text-text-muted hover:bg-[#f1f8f0] hover:font-semibold hover:text-nav-active";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/insights", label: "Insights", icon: LineChart },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/coupons", label: "Coupons", icon: Ticket },
  { to: "/settings", label: "Settings", icon: Settings },

];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<SellerPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

function SellerPortal() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  let isAuthenticated = false;
  try {
    const session = JSON.parse(sessionStorage.getItem("vedacraftsSeller") || "null");
    isAuthenticated = Boolean(session?.token);
    if (!isAuthenticated) sessionStorage.removeItem("vedacraftsSeller");
  } catch {
    sessionStorage.removeItem("vedacraftsSeller");
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const logout = () => {
    sessionStorage.removeItem("vedacraftsSeller");
    sessionStorage.removeItem("vedacraftsSellerSettings");
    navigate("/login", { replace: true });
  };

  return (
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 self-start flex-col overflow-y-auto border-r border-border-muted bg-surface px-4 py-6">
          <div className="mb-4 border-b border-border-muted px-2 pb-6">
            <span className="text-[22px] font-bold text-brand-gold">Veda<span className="text-brand-green">Crafts</span></span>
            <span className="mt-0.5 block text-[11px] text-text-subtle">Connect | Collaborate | Grow</span>
          </div>
          <nav className="flex-1">
            {navItems.map(({ to, label, icon: Icon }) => label === "Settings" ? (
              <div key={to}>
                <button type="button" className={`${navItemClass} w-full cursor-pointer border-0 bg-transparent text-left font-[inherit]`} onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen}>
                  <Icon size={18} /> <span className="flex-1">Settings</span><ChevronDown size={16} className={`transition-transform duration-200 ease-in-out${settingsOpen ? " rotate-180" : ""}`} />
                </button>
                {settingsOpen && <div className="mb-1.5 ml-[34px] -mt-px grid gap-0.5">
                  <button type="button" className={`${settingsSubnavButtonClass} font-[inherit]`}>Profile</button>
                  <button type="button" className={`${settingsSubnavButtonClass} font-[inherit]`}>Business Information</button>
                  <button type="button" className={`${settingsSubnavButtonClass} font-[inherit]`}>Bank Details</button>
                  <button type="button" className={`${settingsSubnavButtonClass} font-[inherit]`}>Selling Location</button>
                </div>}
              </div>
            ) : (
              <NavLink key={to} to={to} className={({ isActive }) => `${navItemClass}${isActive ? ` ${activeNavItemClass}` : ""}`}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className={`${navItemClass} mt-4 w-full cursor-pointer border-0 bg-transparent text-left font-[inherit] text-danger hover:bg-[#fff1f0] hover:text-danger`} onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </aside>

        <main className="flex-1 px-8 py-6">
          <header className="sticky top-0 z-20 -mx-8 -mt-6 mb-5 flex items-center justify-between gap-4 border-b border-[#e5e7eb] bg-surface px-8 py-4">
            <div className="max-w-[500px] flex-1">
              <input className="w-full rounded-lg border border-input-border px-3.5 py-2.5 text-sm" placeholder="Search" />
            </div>
            <div className="flex items-center gap-4">
              <Bell size={20} />
              <div className="size-9 rounded-full bg-avatar" />
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/:id/edit" element={<AddProduct />} />
            <Route path="/orders" element={<Orders />} />

          </Routes>
        </main>
      </div>
  );
}
