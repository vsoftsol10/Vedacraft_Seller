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
  Bell,
  ChevronDown,
  Leaf,
  LogOut,
} from "lucide-react";
import api, { clearSellerSession } from "./api/productapi";
import { clearSellerSession } from "./api/productapi";
import { fetchProfile } from "./api/profileapi";
import Dashboard from "./pages/Dashboard";

const Products = lazy(() => import("./pages/Products"));
const AddProduct = lazy(() => import("./components/products/Addproduct"));
const Orders = lazy(() => import("./pages/Order"));
const Earning = lazy(() => import("./pages/Earning"));
const Login = lazy(() => import("./pages/Login"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Profile = lazy(() => import("./pages/Profile"));
const BusinessInformation = lazy(() => import("./pages/BusinessInformation"));
const BankDetails = lazy(() => import("./pages/BankDetails"));
const SellingLocation = lazy(() => import("./pages/SellingLocation"));
const Insights = lazy(() => import("./pages/Insights"));
// const Earning = lazy(() => import("./pages/Earning"));
const Offers = lazy(() => import("./pages/Offers"));
const CreateOffer = lazy(() => import("./pages/CreateOffer"));
const NAV_ITEM = "mb-1 flex items-center gap-[10px] rounded-lg px-3 py-2.5 text-sm text-[#444] no-underline hover:bg-[#f5f5f5]";
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
          <Route path="/*" element={<SellerPortal />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function PageLoading() {
  return <div className="flex min-h-screen items-center justify-center bg-white" aria-label="Loading page"><LoadingIndicator /></div>;
}

function ContentLoading() {
  return <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center" aria-label="Loading page"><LoadingIndicator /></div>;
}

function LoadingIndicator() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e4f4e2] border-t-[#2f7a3c]" role="status" aria-label="Loading" />;
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

function NewOrderCelebration({ headerRef, bellRef, sellerId }) {
  const [celebration, setCelebration] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const isPlayingRef = useRef(false);
  const toastTimerRef = useRef(null);
  const blastTimerRef = useRef(null);

  useEffect(() => () => {
    window.clearTimeout(toastTimerRef.current);
    window.clearTimeout(blastTimerRef.current);
  }, []);

  useEffect(() => {
    if (!sellerId) return undefined;
    const storageKey = `vedacrafts:lastSeenOrderAt:${sellerId}`;
    let cancelled = false;

    const showToast = () => {
      setToastVisible(true);
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 3200);
    };

    const playCelebration = () => {
      if (isPlayingRef.current) return;
      isPlayingRef.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        showToast();
        isPlayingRef.current = false;
        return;
      }

      const header = headerRef.current;
      const bell = bellRef.current;
      if (!header || !bell) { isPlayingRef.current = false; return; }
      const headerBox = header.getBoundingClientRect();
      const bellBox = bell.getBoundingClientRect();
      const targetX = bellBox.left - headerBox.left + (bellBox.width / 2);
      const targetY = bellBox.top - headerBox.top + (bellBox.height / 2);
      const edge = Math.floor(Math.random() * 4);
      const start = edge === 0 ? { x: Math.random() * headerBox.width, y: -18 } : edge === 1 ? { x: headerBox.width + 18, y: Math.random() * headerBox.height } : edge === 2 ? { x: Math.random() * headerBox.width, y: headerBox.height + 18 } : { x: -18, y: Math.random() * headerBox.height };
      const particles = Array.from({ length: 9 }, (_, index) => ({ id: index, x: Math.round((Math.random() - 0.5) * 92), y: Math.round((Math.random() - 0.35) * 74), rotation: Math.round((Math.random() - 0.5) * 180), delay: index * 18 }));
      setCelebration({ phase: "fly", start, target: { x: targetX, y: targetY }, particles });
      window.requestAnimationFrame(() => setCelebration((current) => current ? { ...current, phase: "arrive" } : current));
    };

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
          playCelebration();
        }
      } catch {
        // Header celebrations are non-critical; failed polls deliberately stay silent.
      }
    };

    checkLatestOrder();
    const intervalId = window.setInterval(checkLatestOrder, 60_000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, [bellRef, headerRef, sellerId]);

  const handleLeafArrival = (event) => {
    if (event.propertyName !== "transform") return;
    setCelebration((current) => current ? { ...current, phase: "blast" } : current);
    setToastVisible(true);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 3200);
    window.clearTimeout(blastTimerRef.current);
    blastTimerRef.current = window.setTimeout(() => { setCelebration(null); isPlayingRef.current = false; }, 650);
  };

  return <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-live="polite">
    {celebration?.phase !== "blast" && <Leaf aria-hidden="true" onTransitionEnd={handleLeafArrival} className={`order-celebration-leaf motion-reduce:animate-none ${celebration?.phase === "arrive" ? "order-celebration-leaf-arrive" : ""}`} style={{ left: celebration?.start.x, top: celebration?.start.y, "--leaf-fly-x": `${(celebration?.target.x || 0) - (celebration?.start.x || 0)}px`, "--leaf-fly-y": `${(celebration?.target.y || 0) - (celebration?.start.y || 0)}px` }} />}
    {celebration?.phase === "blast" && celebration.particles.map((particle) => <Leaf key={particle.id} aria-hidden="true" className="order-celebration-particle motion-reduce:animate-none" style={{ left: celebration.target.x, top: celebration.target.y, "--particle-x": `${particle.x}px`, "--particle-y": `${particle.y}px`, "--particle-rotation": `${particle.rotation}deg`, animationDelay: `${particle.delay}ms` }} />)}
    {toastVisible && <div className="order-confirmation-pill motion-reduce:animate-none">New order confirmed</div>}
  </div>;
}

function SellerPortal() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const headerRef = useRef(null);
  const bellRef = useRef(null);
  let sellerId = null;
  let isAuthenticated = false;
  try {
    const session = JSON.parse(sessionStorage.getItem("vedacraftsSeller") || "null");
    isAuthenticated = Boolean(session?.token);
    if (isAuthenticated) sellerId = session.sellerId || session.applicationId || null;
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
            <div className="h-[52px] overflow-hidden">
              <img src={logo} alt="VedaCrafts" className="h-16 w-auto" />
            </div>
            <span className="mt-1 block whitespace-nowrap text-[10px] tracking-[0.02em] text-[#66756a]">Connect | Collaborate | Grow</span>
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
          <header ref={headerRef} className="sticky top-0 z-20 -mx-8 -mt-6 mb-5 flex items-center justify-between gap-4 border-b border-[#e5e7eb] bg-white px-8 py-4">
            <div className="max-w-[500px] flex-1">
              <input className="w-full rounded-lg border border-[#e5e5e5] px-3.5 py-2.5 text-sm" placeholder="Search" />
            </div>
            <div className="relative flex items-center gap-4">
              <span ref={bellRef} className="relative z-10 flex"><Bell size={20} /></span>
              <HeaderProfileImage />
            </div>
            <NewOrderCelebration headerRef={headerRef} bellRef={bellRef} sellerId={sellerId} />
          </header>

          <Suspense fallback={<ContentLoading />}>
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
            <Route path="/insights" element={<Insights />} />

            <Route path="/settings/offers" element={<Offers />} />
            <Route path="/settings/offers/new" element={<CreateOffer />} />    

            </Routes>
          </Suspense>
        </main>
      </div>
  );
}
