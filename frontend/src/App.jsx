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
  LifeBuoy,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";
import Products from "./pages/Products";
import Dashboard from "./pages/Dashboard"
import AddProduct from "./components/products/Addproduct";
import Orders from "./pages/Order"
import Login from "./pages/Login";
import "./styles/app.css";

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
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-name">Veda<span className="brand-accent">Crafts</span></span>
            <span className="brand-tagline">Connect | Collaborate | Grow</span>
          </div>
          <nav>
            {navItems.map(({ to, label, icon: Icon }) => label === "Settings" ? (
              <div className="settings-nav-group" key={to}>
                <button type="button" className="nav-item settings-nav-toggle" onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen}>
                  <Icon size={18} /> <span>Settings</span><ChevronDown size={16} className={settingsOpen ? "settings-chevron open" : "settings-chevron"} />
                </button>
                {settingsOpen && <div className="settings-subnav">
                  <button type="button">Profile</button>
                  <button type="button">Business Information</button>
                  <button type="button">Bank Details</button>
                  <button type="button">Selling Location</button>
                </div>}
              </div>
            ) : (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className="nav-item logout-button" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div className="topbar-search">
              <input placeholder="Search" />
            </div>
            <div className="topbar-actions">
              <Bell size={20} />
              <div className="avatar" />
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
