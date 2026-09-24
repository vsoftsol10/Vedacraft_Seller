import { useEffect, useState } from "react";
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
import Reviews from "./pages/Reviews";
import Profile from "./pages/Profile";
import BusinessInformation from "./pages/BusinessInformation";
import BankDetails from "./pages/BankDetails";
import SellingLocation from "./pages/SellingLocation";
import Offers from "./pages/Offers";
import CreateOffer from "./pages/CreateOffer";
import Earning from "./pages/Earning";
import { clearSellerSession } from "./api/productapi";
import { fetchProfile } from "./api/profileapi";

const NAV_ITEM = "mb-1 flex items-center gap-[10px] rounded-lg px-3 py-2.5 text-sm text-[#444] no-underline hover:bg-[#f5f5f5]";
const ACTIVE_NAV_ITEM = "bg-[#e4f4e2] font-semibold text-[#2f7a3c]";
const SETTINGS_BUTTON = `${NAV_ITEM} w-full cursor-pointer border-0 bg-transparent text-left font-[inherit]`;

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/insights", label: "Insights", icon: LineChart },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/settings/offers", label: "Offers", icon: Ticket },
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

function HeaderProfileImage() {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadProfileImage = async () => {
      try {
        const profile = await fetchProfile();
        if (!cancelled) setImageUrl(profile?.profileImage ?? null);
      } catch {
        if (!cancelled) setImageUrl(null);
      }
    };
    loadProfileImage();
    window.addEventListener("seller-profile-updated", loadProfileImage);
    return () => {
      cancelled = true;
      window.removeEventListener("seller-profile-updated", loadProfileImage);
    };
  }, []);

  if (!imageUrl) return <div className="h-9 w-9 rounded-full bg-[#ddd]" aria-label="Profile image" />;
  return <img src={imageUrl} alt="Profile" className="h-9 w-9 rounded-full object-cover" onError={() => setImageUrl(null)} />;
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
    clearSellerSession();
    navigate("/login", { replace: true });
  };

  return (
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 self-start flex-col overflow-y-auto border-r border-[#eee] bg-white px-4 py-6">
          <div className="mb-4 border-b border-[#eee] px-2 pb-6">
            <span className="text-[22px] font-bold text-[#f2a93b]">Veda<span className="text-[#4f9d5d]">Crafts</span></span>
            <span className="mt-0.5 block text-[11px] text-[#999]">Connect | Collaborate | Grow</span>
          </div>
          <nav className="flex-1">
            {navItems.map(({ to, label, icon: Icon }) => label === "Settings" ? (
              <div key={to}>
                <button type="button" className={SETTINGS_BUTTON} onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen}>
                  <Icon size={18} /> <span className="flex-1">Settings</span><ChevronDown size={16} className={`transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`} />
                </button>
                {settingsOpen && <div className="mb-1.5 ml-[34px] grid -mt-px gap-0.5">
                  <NavLink to="/settings/profile" className={({ isActive }) => `rounded-md px-2.5 py-[7px] text-left text-xs text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Profile</NavLink>
                  <NavLink to="/settings/business-information" className={({ isActive }) => `rounded-md px-2.5 py-[7px] text-left text-xs text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Business Information</NavLink>
                  <NavLink to="/settings/bank-details" className={({ isActive }) => `rounded-md px-2.5 py-[7px] text-left text-xs text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Bank Details</NavLink>
                  <NavLink to="/settings/selling-location" className={({ isActive }) => `rounded-md px-2.5 py-[7px] text-left text-xs text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Selling Location</NavLink>
                </div>}
              </div>
            ) : (
              <NavLink key={to} to={to} className={({ isActive }) => `${NAV_ITEM}${isActive ? ` ${ACTIVE_NAV_ITEM}` : ""}`}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className={`${NAV_ITEM} mt-4 w-full cursor-pointer border-0 bg-transparent text-left font-[inherit] text-[#b42318] hover:bg-[#fff1f0] hover:text-[#b42318]`} onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </aside>

        <main className="flex-1 px-8 py-6">
          <header className="sticky top-0 z-20 -mx-8 -mt-6 mb-5 flex items-center justify-between gap-4 border-b border-[#e5e7eb] bg-white px-8 py-4">
            <div className="max-w-[500px] flex-1">
              <input className="w-full rounded-lg border border-[#e5e5e5] px-3.5 py-2.5 text-sm" placeholder="Search" />
            </div>
            <div className="flex items-center gap-4">
              <Bell size={20} />
              <HeaderProfileImage />
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/:id/edit" element={<AddProduct />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/earnings" element={<Earning />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/settings/reviews" element={<Reviews />} />
            <Route path="/settings/profile" element={<Profile />} />
            <Route path="/settings/business-information" element={<BusinessInformation />} />
            <Route path="/settings/bank-details" element={<BankDetails />} />
            <Route path="/settings/selling-location" element={<SellingLocation />} /> 
            <Route path="/settings/offers" element={<Offers />} />
            <Route path="/settings/offers/new" element={<CreateOffer />} />    

          </Routes>
        </main>
      </div>
  );
}
