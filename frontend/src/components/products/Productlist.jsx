// src/components/products/Productlist.jsx
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Package, IndianRupee, Box, Star, MoreVertical, Eye, Pencil, Trash2, Check, X } from "lucide-react";
import { deleteProduct, getProductCategories, getProducts, getProductStats ,updateProductStatus} from "../../api/productapi";
import ProductDetails from "./ProductDetails";
import { FORM_ERROR_BANNER } from "../../constants/ui";

/* ---------- Tailwind class constants ---------- */
const PAGE_HEADER = "mb-5 flex items-start justify-between";
const PAGE_TITLE = "mb-1 text-[28px] font-bold";
const PAGE_SUBTITLE = "text-[14px] text-[#777]";
const ADD_BTN =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[#f2a93b] px-[18px] py-3 font-semibold text-white hover:bg-[#e2992b]";

const STATS_ROW = "mb-5 grid grid-cols-[repeat(4,1fr)] gap-4";
const STAT_CARD = "flex items-start gap-3 rounded-xl border border-[#eee] bg-white p-4";
const STAT_ICON = "flex h-9 w-9 items-center justify-center rounded-lg";
const STAT_LABEL = "text-[13px] text-[#666]";
const STAT_VALUE = "mt-1.5 mb-1 text-[22px] font-bold";

const TOOLBAR = "mb-3 flex justify-between gap-3";
const SEARCH_BOX = "flex flex-1 items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-3.5 py-2.5";
const SEARCH_INPUT = "flex-1 border-0 text-[14px] outline-none";
const TOOLBAR_ACTIONS = "flex gap-2.5";
const GHOST_BTN =
  "flex min-w-[86px] cursor-pointer items-center justify-center gap-[5px] rounded-lg border px-4 py-2.5 text-[14px]";
const GHOST_IDLE = "border-[#e5e5e5] bg-white";
const GHOST_ACTIVE = "border-[#e5a13b] bg-[#fff8eb] text-[#9b5d08]";

const TOOLBAR_MENU =
  "absolute top-[calc(100%+7px)] right-0 z-10 max-h-[260px] min-w-[180px] overflow-y-auto rounded-[10px] border border-[#e8e8e8] bg-white p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.12)]";
const TOOLBAR_MENU_TITLE = "mx-2 mt-[5px] mb-1.5 text-[12px] font-semibold text-[#777]";
const MENU_ITEM =
  "flex w-full cursor-pointer items-center gap-2 rounded-md border-0 px-2 py-[9px] text-left text-[13px]";
const MENU_ITEM_IDLE = "bg-transparent text-[#333] hover:bg-[#f3f8f3] hover:text-[#277437]";
const MENU_ITEM_SELECTED = "bg-[#f3f8f3] text-[#277437]";

const APPLIED_FILTERS = "-mt-[3px] mb-3 flex flex-wrap items-center gap-2 text-[13px] text-[#666]";
const FILTER_CHIP =
  "inline-flex cursor-pointer items-center gap-[5px] rounded-full border border-[#d7ead9] bg-[#f2f9f3] px-[9px] py-[5px] text-[13px] text-[#287338] hover:bg-[#e4f3e6]";
const CLEAR_FILTERS =
  "cursor-pointer border-0 bg-transparent px-0.5 py-[5px] text-[13px] font-semibold text-[#b76b04] hover:underline";

const TABLE_CARD = "rounded-xl border border-[#eee] bg-white";
const TABLE = "w-full border-collapse";
const TH = "border-b border-[#eee] px-4 py-3.5 text-left text-[13px] text-[#555]";
const TD_COMMON = "border-b border-[#f5f5f5] text-[14px]";
const TD = `${TD_COMMON} px-4 py-3.5`;
const TD_EMPTY = `${TD_COMMON} p-8 text-center text-[#999]`;

const STATUS_BADGE_BASE =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-2.5 py-1 text-[12px] font-semibold";
const STATUS_BADGE_ACTIVE = "bg-[#d9f2df] text-[#277437]";
const STATUS_BADGE_INACTIVE = "bg-[#fdeceb] text-[#c93636]";

// "action-cell" is also a JS hook: the outside-click handler uses closest(".action-cell").
const ACTION_CELL = "action-cell relative w-[52px] border-b border-[#f5f5f5] px-4 py-3.5 text-[14px]";
const ACTION_TRIGGER =
  "grid cursor-pointer place-items-center rounded-md border-0 bg-transparent p-1.5 text-[#555] hover:bg-[#f1f5f1]";
const ACTION_MENU =
  "absolute right-3 bottom-[42px] z-[5] w-[130px] rounded-lg border border-[#e6e6e6] bg-white p-[5px] shadow-[0_8px_22px_rgba(0,0,0,0.14)]";
const ACTION_ITEM =
  "flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent p-[9px] text-left text-[13px] hover:bg-[#f6f7f6]";
const TOGGLE_TRACK = "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-0 transition-colors";
const TOGGLE_THUMB = "inline-block h-4 w-4 transform rounded-full bg-white transition-transform";
export default function ProductsList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, inStock: 0, outOfStock: 0, lowStock: 0 });
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const toolbarRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [menuId, setMenuId] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [actionError, setActionError] = useState("");

  const loadData = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = {
        search: filters.search ?? search,
        category: filters.category ?? category,
        stockStatus: filters.stockStatus ?? stockStatus,
        limit: 100,
      };
      const [productsRes, statsRes] = await Promise.all([
        getProducts(params),
        getProductStats(),
      ]);
      setProducts(productsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, stockStatus]);

  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      try {
        const [productsRes, statsRes, categoriesRes] = await Promise.all([getProducts({ search: "", category: "", stockStatus: "", limit: 100 }), getProductStats(), getProductCategories()]);
        if (!cancelled) { setProducts(productsRes.data); setStats(statsRes.data); setCategories(categoriesRes.data); }
      } catch (err) { console.error(err); } finally { if (!cancelled) setLoading(false); }
    };
    loadInitialData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!toolbarRef.current?.contains(event.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
    const closeActionMenu = (event) => {
      if (!event.target.closest(".action-cell")) setMenuId(null);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuId(null);
    };
    document.addEventListener("mousedown", closeActionMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeActionMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData({ search });
  };

  const handleCategoryChange = (event) => {
    const nextCategory = event;
    setCategory(nextCategory);
    loadData({ category: nextCategory });
    setOpenMenu(null);
  };

  const handleStockStatusChange = (event) => {
    const nextStockStatus = event;
    setStockStatus(nextStockStatus);
    loadData({ stockStatus: nextStockStatus });
    setOpenMenu(null);
  };

  const clearFilters = () => {
    setCategory("");
    setStockStatus("");
    loadData({ category: "", stockStatus: "" });
  };

  const handleDelete = async (product) => {
    setMenuId(null);
    if (!window.confirm(`Delete ${product.productName}? This cannot be undone.`)) return;
    try {
      await deleteProduct(product._id);
      setProducts((current) => current.filter(({ _id }) => _id !== product._id));
      setStats((current) => ({ ...current, totalProducts: Math.max(0, current.totalProducts - 1) }));
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to delete product");
    }
  };
const handleToggleStatus = async (product) => {
  const nextActive = !product.isActive;
  // optimistic update
  setProducts((current) =>
    current.map((p) => (p._id === product._id ? { ...p, isActive: nextActive } : p))
  );
  try {
    await updateProductStatus(product._id, nextActive);
  } catch (err) {
    // revert on failure
    setProducts((current) =>
      current.map((p) => (p._id === product._id ? { ...p, isActive: !nextActive } : p))
    );
    setActionError(err?.response?.data?.message || "Unable to update product status");
  }
};
  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <div>
      <div className={PAGE_HEADER}>
        <div>
          <h1 className={PAGE_TITLE}>Products</h1>
          <p className={PAGE_SUBTITLE}>Manage your products, inventory and pricing all in one place</p>
        </div>
        <button className={ADD_BTN} onClick={() => navigate("/products/add")}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className={STATS_ROW}>
        <StatCard icon={<Package size={20} />} label="Total Products" value={stats.totalProducts} iconBg="#fdeacb" />
        <StatCard icon={<IndianRupee size={20} />} label="In Stock" value={stats.inStock} iconBg="#d9f2df" />
        <StatCard icon={<Box size={20} />} label="Out of Stock" value={stats.outOfStock} iconBg="#d9f2df" />
        <StatCard icon={<Star size={20} />} label="Low Stock" value={stats.lowStock} iconBg="#fdeacb" />
      </div>

      <div className={TOOLBAR}>
        <form className={SEARCH_BOX} onSubmit={handleSearch}>
          <Search size={18} />
          <input
            className={SEARCH_INPUT}
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className={TOOLBAR_ACTIONS} ref={toolbarRef}>
          <div className="relative">
            <button
              type="button"
              className={`${GHOST_BTN} ${category ? GHOST_ACTIVE : GHOST_IDLE}`}
              onClick={() => setOpenMenu(openMenu === "category" ? null : "category")}
              aria-expanded={openMenu === "category"}
            >
              {category || "Filter"}
            </button>
            {openMenu === "category" && (
              <div className={TOOLBAR_MENU} role="menu" aria-label="Filter by category">
                <p className={TOOLBAR_MENU_TITLE}>Category</p>
                <MenuOption selected={!category} onClick={() => handleCategoryChange("")}>
                  All categories
                </MenuOption>
                {categories.map((item) => (
                  <MenuOption key={item} selected={category === item} onClick={() => handleCategoryChange(item)}>
                    {item}
                  </MenuOption>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              className={`${GHOST_BTN} ${stockStatus ? GHOST_ACTIVE : GHOST_IDLE}`}
              onClick={() => setOpenMenu(openMenu === "stock" ? null : "stock")}
              aria-expanded={openMenu === "stock"}
            >
              {stockStatus || "Sort by"}
            </button>
            {openMenu === "stock" && (
              <div className={TOOLBAR_MENU} role="menu" aria-label="Filter by stock status">
                <p className={TOOLBAR_MENU_TITLE}>Stock status</p>
                {["", "In Stock", "Out of Stock", "Low Stock"].map((item) => (
                  <MenuOption key={item || "all"} selected={stockStatus === item} onClick={() => handleStockStatusChange(item)}>
                    {item || "All products"}
                  </MenuOption>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {(category || stockStatus) && (
        <div className={APPLIED_FILTERS} aria-label="Applied filters">
          <span>Applied filters:</span>
          {category && (
            <button type="button" className={FILTER_CHIP} onClick={() => handleCategoryChange("")}>
              Category: {category} <X size={14} />
            </button>
          )}
          {stockStatus && (
            <button type="button" className={FILTER_CHIP} onClick={() => handleStockStatusChange("")}>
              Stock: {stockStatus} <X size={14} />
            </button>
          )}
          <button type="button" className={CLEAR_FILTERS} onClick={clearFilters}>Clear all</button>
        </div>
      )}
      {actionError && <div className={`${FORM_ERROR_BANNER} mb-4`}>{actionError}</div>}

      <div className={TABLE_CARD}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Product ID</th>
              <th className={TH}>Product Name</th>
              <th className={TH}>Category</th>
              <th className={TH}>Price</th>
              <th className={TH}>Status</th>
              <th className={TH}>Date</th>
              <th className={TH}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className={TD_EMPTY}>Loading...</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr><td colSpan={7} className={TD_EMPTY}>No products found</td></tr>
            )}
            {!loading && products.map((p) => (
              <tr key={p._id}>
                <td className={TD}>{p.productId}</td>
                <td className={TD}>{p.productName}</td>
                <td className={TD}>{p.category}</td>
                <td className={TD}>₹{Number(p.pricing?.sellingPrice ?? 0).toLocaleString("en-IN")}</td>
                <td className={TD}>
  <div className="flex items-center gap-2">
    <button
      type="button"
      role="switch"
      aria-checked={p.isActive}
      aria-label={`Toggle status for ${p.productName}`}
      onClick={() => handleToggleStatus(p)}
      className={`${TOGGLE_TRACK} ${p.isActive ? "bg-[#4f9d5d]" : "bg-[#d9534f]"}`}
    >
      <span
        className={`${TOGGLE_THUMB} ${p.isActive ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
    <span className={`text-[13px] font-medium ${p.isActive ? "text-[#277437]" : "text-[#c93636]"}`}>
      {p.isActive ? "Active" : "Inactive"}
    </span>
  </div>
</td>
                <td className={TD}>{formatDate(p.createdAt)}</td>
                <td className={ACTION_CELL}>
                  <button className={ACTION_TRIGGER} onClick={() => setMenuId(menuId === p._id ? null : p._id)} aria-label={`Actions for ${p.productName}`}><MoreVertical size={18} /></button>
                  {menuId === p._id && (
                    <div className={ACTION_MENU}>
                      <button className={ACTION_ITEM} onClick={() => { setViewProduct(p); setMenuId(null); }}><Eye size={16} /> View</button>
                      <button className={ACTION_ITEM} onClick={() => navigate(`/products/${p._id}/edit`)}><Pencil size={16} /> Edit</button>
                      <button className={`${ACTION_ITEM} text-[#c93636]`} onClick={() => handleDelete(p)}><Trash2 size={16} /> Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProductDetails product={viewProduct} onClose={() => setViewProduct(null)} />
    </div>
  );
}

function MenuOption({ selected, onClick, children }) {
  return (
    <button
      type="button"
      className={`${MENU_ITEM} ${selected ? MENU_ITEM_SELECTED : MENU_ITEM_IDLE}`}
      onClick={onClick}
    >
      <Check size={15} className={`text-[#277437] ${selected ? "visible" : "invisible"}`} />
      {children}
    </button>
  );
}


function StatCard({ icon, label, value, iconBg }) {
  return (
    <div className={STAT_CARD}>
      <div className={STAT_ICON} style={{ background: iconBg }}>{icon}</div>
      <div>
        <p className={STAT_LABEL}>{label}</p>
        <p className={STAT_VALUE}>{value}</p>
      </div>
    </div>
  );
}