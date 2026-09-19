import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Package, IndianRupee, Box, Star, MoreVertical, Eye, Pencil, Trash2, Check, ChevronDown, X } from "lucide-react";
import { deleteProduct, getProductCategories, getProducts, getProductStats } from "../../api/productapi";
import ProductDetails from "./ProductDetails";
import "../../styles/productlist.css";

const statusClass = {
  "In Stock": "status-in-stock",
  "Out of Stock": "status-out-of-stock",
  "Low Stock": "status-low-stock",
};

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

  const loadData = async (filters = {}) => {
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
  };

  useEffect(() => {
    loadData();
    getProductCategories()
      .then(({ data }) => setCategories(data))
      .catch((err) => console.error(err));
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

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your products, inventory and pricing all in one place</p>
        </div>
        <button className="add-product-btn" onClick={() => navigate("/products/add")}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="stats-row">
        <StatCard icon={<Package size={20} />} label="Total Products" value={stats.totalProducts} iconBg="#fdeacb" />
        <StatCard icon={<IndianRupee size={20} />} label="In Stock" value={stats.inStock} iconBg="#d9f2df" />
        <StatCard icon={<Box size={20} />} label="Out of Stock" value={stats.outOfStock} iconBg="#d9f2df" />
        <StatCard icon={<Star size={20} />} label="Low Stock" value={stats.lowStock} iconBg="#fdeacb" />
      </div>

      <div className="table-toolbar">
        <form className="search-box" onSubmit={handleSearch}>
          <Search size={18} />
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="toolbar-actions" ref={toolbarRef}>
          <div className="toolbar-menu-wrap">
            <button type="button" className={`ghost-btn menu-trigger ${category ? "is-active" : ""}`} onClick={() => setOpenMenu(openMenu === "category" ? null : "category")} aria-expanded={openMenu === "category"}>
              {category || "Filter"}
            </button>
            {openMenu === "category" && <div className="toolbar-menu" role="menu" aria-label="Filter by category">
              <p className="toolbar-menu-title">Category</p>
              <button type="button" className={!category ? "selected" : ""} onClick={() => handleCategoryChange("")}><Check size={15} /> All categories</button>
              {categories.map((item) => <button type="button" key={item} className={category === item ? "selected" : ""} onClick={() => handleCategoryChange(item)}><Check size={15} /> {item}</button>)}
            </div>}
          </div>
          <div className="toolbar-menu-wrap">
            <button type="button" className={`ghost-btn menu-trigger ${stockStatus ? "is-active" : ""}`} onClick={() => setOpenMenu(openMenu === "stock" ? null : "stock")} aria-expanded={openMenu === "stock"}>
              {stockStatus || "Sort by"}
            </button>
            {openMenu === "stock" && <div className="toolbar-menu" role="menu" aria-label="Filter by stock status">
              <p className="toolbar-menu-title">Stock status</p>
              {["", "In Stock", "Out of Stock", "Low Stock"].map((item) => <button type="button" key={item || "all"} className={stockStatus === item ? "selected" : ""} onClick={() => handleStockStatusChange(item)}><Check size={15} /> {item || "All products"}</button>)}
            </div>}
          </div>
        </div>
      </div>
      {(category || stockStatus) && <div className="applied-filters" aria-label="Applied filters">
        <span>Applied filters:</span>
        {category && <button type="button" className="filter-chip" onClick={() => handleCategoryChange("")}>Category: {category} <X size={14} /></button>}
        {stockStatus && <button type="button" className="filter-chip" onClick={() => handleStockStatusChange("")}>Stock: {stockStatus} <X size={14} /></button>}
        <button type="button" className="clear-filters" onClick={clearFilters}>Clear all</button>
      </div>}
      {actionError && <div className="form-error-banner">{actionError}</div>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="empty-row">Loading...</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr><td colSpan={7} className="empty-row">No products found</td></tr>
            )}
            {!loading && products.map((p) => (
              <tr key={p._id}>
                <td>{p.productId}</td>
                <td>{p.productName}</td>
                <td>{p.category}</td>
                <td>₹{Number(p.pricing?.sellingPrice ?? 0).toLocaleString("en-IN")}</td>
                <td>
                  <span className={`status-dot ${statusClass[p.stockStatus]}`} />
                  {p.stockStatus}
                </td>
                <td>{formatDate(p.createdAt)}</td>
                <td className="action-cell">
                  <button className="action-trigger" onClick={() => setMenuId(menuId === p._id ? null : p._id)} aria-label={`Actions for ${p.productName}`}><MoreVertical size={18} /></button>
                  {menuId === p._id && <div className="product-action-menu">
                    <button onClick={() => { setViewProduct(p); setMenuId(null); }}><Eye size={16} /> View</button>
                    <button onClick={() => navigate(`/products/${p._id}/edit`)}><Pencil size={16} /> Edit</button>
                    <button className="delete-action" onClick={() => handleDelete(p)}><Trash2 size={16} /> Delete</button>
                  </div>}
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

function StatCard({ icon, label, value, iconBg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
       
      </div>
    </div>
  );
}
