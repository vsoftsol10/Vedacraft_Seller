import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  LineChart,
  Wallet,
  Star,
  Ticket,
  Settings,
  ChevronDown,
  Truck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import api, { clearSellerSession, getSellerSession } from "./api/productapi";
import { fetchProfile } from "./api/profileapi";
import logo from "./assets/images/logo-transparent.png";
import NotificationMenu from "./components/layout/NotificationMenu";
import OrderArrivalEffect from "./components/animations/NewOrderCelebration";

const Products = lazy(() => import("./pages/Products"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddProduct = lazy(() => import("./components/products/Addproduct"));
const Orders = lazy(() => import("./pages/Order"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BecomeSeller = lazy(() => import("./pages/BecomeSeller"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Profile = lazy(() => import("./pages/Profile"));
const Documents = lazy(() => import("./pages/Documents"));
const BusinessInformation = lazy(() => import("./pages/BusinessInformation"));
const BankDetails = lazy(() => import("./pages/BankDetails"));
const SellingLocation = lazy(() => import("./pages/SellingLocation"));
const Insights = lazy(() => import("./pages/Insights"));
const Earning = lazy(() => import("./pages/Earning"));
const Offers = lazy(() => import("./pages/Offers"));
const CreateOffer = lazy(() => import("./pages/CreateOffer"));
const SIDEBAR_WIDTH = "w-[288px]";
const NAV_ITEM = "mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-base text-[#444] no-underline hover:bg-[#f5f5f5]";
const ACTIVE_NAV_ITEM = "bg-[#e4f4e2] font-semibold text-[#2f7a3c]";
const SETTINGS_BUTTON = `${NAV_ITEM} w-full cursor-pointer border-0 bg-transparent text-left font-[inherit]`;

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  // { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/insights", label: "Insights", icon: LineChart },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/settings/offers", label: "Offers", icon: Ticket },
  { to: "/settings", label: "Settings", icon: Settings },

];

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/become-seller" element={<BecomeSeller />} />
          <Route path="/*" element={<SellerPortal />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function PageLoading() {
  return <div className="min-h-screen bg-white" aria-label="Loading page" />;
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

  if (!imageUrl) return <div className="h-7 w-7 rounded-full bg-[#ddd]" aria-label="Profile image" />;
  return <img src={imageUrl} alt="Profile" className="h-7 w-7 rounded-full object-cover" onError={() => setImageUrl(null)} />;
}

// Polls for new orders and plays the truck -> leaf burst -> popup animation.
function NewOrderCelebration({ headerRef, logoRef, parkedRef, sellerId }) {
  const navigate = useNavigate();
  const [trigger, setTrigger] = useState(0);
  const [sellerName, setSellerName] = useState("");

  // Seller name for the popup. Change the field names below to match your profile API.
  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((profile) => {
        if (!cancelled) setSellerName(profile?.name || profile?.fullName || profile?.businessName || "");
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Dev only: run window.testNewOrder() in the browser console to preview the animation.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    window.testNewOrder = () => setTrigger(Date.now());
    return () => { delete window.testNewOrder; };
  }, []);

  useEffect(() => {
    if (!sellerId) return undefined;
    const storageKey = `vedacrafts:lastSeenOrderAt:${sellerId}`;
    let cancelled = false;

    const checkLatestOrder = async () => {
      try {
        const response = await api.get("/orders/latest");
        if (cancelled) return;
        const latest = response.data?.data;
        const previous = localStorage.getItem(storageKey);
        if (previous === null) {
          localStorage.setItem(storageKey, latest?.createdAt || "");
          return;
        }
        if (latest?.createdAt && (!previous || new Date(latest.createdAt) > new Date(previous))) {
          localStorage.setItem(storageKey, latest.createdAt);
          setTrigger(Date.now());
        }
      } catch {
        // Header celebrations are non-critical; failed polls deliberately stay silent.
      }
    };

    checkLatestOrder();
    const intervalId = window.setInterval(checkLatestOrder, 60_000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, [sellerId]);

  return (
    <OrderArrivalEffect
      trigger={trigger}
      sellerName={sellerName}
      logoRef={logoRef}
      headerRef={headerRef}
      parkedRef={parkedRef}
      onViewOrder={() => navigate("/orders")}
    />
  );
}

const searchablePages = [
  { label: "Dashboard", to: "/dashboard", keywords: "home overview" },
  { label: "Products", to: "/products", keywords: "product catalogue inventory" },
  { label: "Orders", to: "/orders", keywords: "order sales shipments" },
  { label: "Insights", to: "/insights", keywords: "analytics reports trends" },
  { label: "Earnings", to: "/earnings", keywords: "revenue payments payout" },
  { label: "Reviews", to: "/reviews", keywords: "ratings feedback" },
  { label: "Offers", to: "/settings/offers", keywords: "discount promotion coupon deal" },
  { label: "Settings", to: "/settings/documents", keywords: "account preferences documents" },
  { label: "Documents", to: "/settings/documents", keywords: "settings upload pan gst aadhaar" },
  { label: "Business Information", to: "/settings/business-information", keywords: "settings store business" },
  { label: "Bank Details", to: "/settings/bank-details", keywords: "settings payout payment account" },
  { label: "Selling Location", to: "/settings/selling-location", keywords: "settings address location" },
];

function PageSearch({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? searchablePages.filter((page) => `${page.label} ${page.keywords}`.toLowerCase().includes(normalizedQuery))
    : [];

  useEffect(() => {
    const close = (event) => { if (searchRef.current && !searchRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const choose = (page) => {
    if (!page) return;
    onNavigate(page.to);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!matches.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, matches.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.max(index - 1, 0)); }
    if (event.key === "Enter") { event.preventDefault(); choose(matches[activeIndex]); }
    if (event.key === "Escape") setOpen(false);
  };

  return <div ref={searchRef} className="relative max-w-[440px] flex-1">
    <input value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }} onFocus={() => normalizedQuery && setOpen(true)} onKeyDown={handleKeyDown} className="w-full rounded-md border border-[#e5e5e5] px-3 py-2 text-xs" placeholder="Search pages" role="combobox" aria-expanded={open && Boolean(normalizedQuery)} aria-controls="page-search-results" aria-autocomplete="list" />
    {open && normalizedQuery && <div id="page-search-results" role="listbox" className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
      {matches.length ? matches.map((page, index) => <button key={`${page.label}-${page.to}`} type="button" role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(page)} className={`flex w-full cursor-pointer items-center border-0 px-3.5 py-2.5 text-left text-sm ${index === activeIndex ? "bg-[#eaf6e8] text-[#276b35]" : "bg-white text-[#333] hover:bg-gray-50"}`}><span>{page.label}</span><span className="ml-auto text-xs text-gray-400">Go to page</span></button>) : <p className="m-0 px-3.5 py-3 text-sm text-gray-500">No matching pages.</p>}
    </div>}
  </div>;
}

function SellerPortal() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const bellRef = useRef(null);
  const parkedTruckRef = useRef(null);
  let sellerId = null;
  let isAuthenticated = false;
  try {
    const session = getSellerSession();
    isAuthenticated = Boolean(session?.token);
    if (isAuthenticated) sellerId = session.sellerId || session.applicationId || null;
    if (!isAuthenticated) clearSellerSession();
  } catch {
    clearSellerSession();
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const logout = () => {
    clearSellerSession();
    navigate("/login", { replace: true });
  };

  const closeSidebar = () => setSidebarOpen(false);
  const navigateToPage = (to) => {
    if (to.startsWith("/settings/")) setSettingsOpen(true);
    navigate(to);
    closeSidebar();
  };

  return (
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex h-screen ${SIDEBAR_WIDTH} shrink-0 flex-col overflow-y-auto border-r border-[#eee] bg-white px-4 py-5 transition-transform duration-200 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-0 lg:translate-x-0`}
        >
          <div className="mb-4 flex items-center justify-between border-b border-[#eee] px-1 pb-5">
            <div>
              <div className="h-12 overflow-hidden">
                <img ref={logoRef} src={logo} alt="VedaCrafts" className="h-14 w-auto" />
              </div>
              <span className="mt-1.5 block whitespace-nowrap pl-1 text-xs font-medium tracking-[0.02em] text-[#111111]">Connect | Collaborate | Grow</span>
            </div>
            <button
              type="button"
              className="text-[#666] hover:text-[#333] lg:hidden"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1">
            {navItems.map(({ to, label, icon: Icon }) => label === "Settings" ? (
              <div key={to}>
                <button type="button" className={SETTINGS_BUTTON} onClick={() => { navigate("/settings/profile"); setSettingsOpen(true); }} aria-expanded={settingsOpen}>
                  <Icon size={22} /> <span className="flex-1">Settings</span><ChevronDown size={18} className={`transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`} />
                </button>
                {settingsOpen && <div className="mb-2 ml-[46px] grid -mt-px gap-1">
                  <NavLink to="/settings/documents" onClick={closeSidebar} className={({ isActive }) => `rounded-md px-3 py-2.5 text-left text-sm text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Documents</NavLink>
                  <NavLink to="/settings/business-information" onClick={closeSidebar} className={({ isActive }) => `rounded-md px-3 py-2.5 text-left text-sm text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Business Information</NavLink>
                  <NavLink to="/settings/bank-details" onClick={closeSidebar} className={({ isActive }) => `rounded-md px-3 py-2.5 text-left text-sm text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Bank Details</NavLink>
                  <NavLink to="/settings/selling-location" onClick={closeSidebar} className={({ isActive }) => `rounded-md px-3 py-2.5 text-left text-sm text-[#666] no-underline hover:bg-[#f1f8f0] hover:font-semibold hover:text-[#2f7a3c]${isActive ? " bg-[#f1f8f0] font-semibold text-[#2f7a3c]" : ""}`}>Selling Location</NavLink>
                </div>}
              </div>
            ) : (
              <NavLink key={to} to={to} onClick={closeSidebar} className={({ isActive }) => `${NAV_ITEM}${isActive ? ` ${ACTIVE_NAV_ITEM}` : ""}`}>
                <Icon size={22} /> {label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className={`${NAV_ITEM} mt-4 w-full cursor-pointer border-0 bg-transparent text-left font-[inherit] text-[#b42318] hover:bg-[#fff1f0] hover:text-[#b42318]`} onClick={logout}>
            <LogOut size={22} /> Logout
          </button>
        </aside>

        <main className="flex-1 px-4 py-4 sm:px-6">
          <header ref={headerRef} className="sticky top-0 z-20 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white px-4 py-3 sm:-mx-6 sm:px-6">
            <button
              type="button"
              className="text-[#444] hover:text-[#222] lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <PageSearch onNavigate={navigateToPage} />
            <div className="relative flex items-center gap-3">
              <span ref={parkedTruckRef} className="inline-flex" aria-hidden="true"><Truck size={30} color="#2b7a1d" strokeWidth={2} /></span>
              <NotificationMenu bellRef={bellRef} />
              <HeaderProfileImage />
            </div>
          </header>

          <Suspense fallback={null}>
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
              <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
              <Route path="/settings/profile" element={<Profile />} />
              <Route path="/settings/documents" element={<Documents />} />
              <Route path="/settings/business-information" element={<BusinessInformation />} />
              <Route path="/settings/bank-details" element={<BankDetails />} />
              <Route path="/settings/selling-location" element={<SellingLocation />} />
              <Route path="/insights" element={<Insights />} />

              <Route path="/settings/offers" element={<Offers />} />
              <Route path="/settings/offers/new" element={<CreateOffer />} />

            </Routes>
          </Suspense>
        </main>

        {/* Outside the header so the truck can pass over the sidebar and the popup covers the whole page */}
        <NewOrderCelebration headerRef={headerRef} logoRef={logoRef} parkedRef={parkedTruckRef} sellerId={sellerId} />
      </div>
  );
}
