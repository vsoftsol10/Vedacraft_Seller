import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { bulkAddStock } from "../../api/productapi";

const stockOf = (product) => Number(product.inventory?.stockQuantity ?? product.stockQuantity ?? product.quantity ?? product.stock ?? 0);

export default function BulkQuantityUpdate({ products, onClose, onUpdated }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const visibleProducts = useMemo(() => products.filter((product) =>
    [product.productId, product.productName, product.inventory?.sku].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [products, query]);
  const chosenProducts = products.filter((product) => selected.includes(product._id));

  const toggleProduct = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setError("");
  };
  const save = async () => {
    const updates = chosenProducts.map((product) => ({ id: product._id, quantity: Number(quantities[product._id]) }));
    if (!updates.length || updates.some(({ quantity }) => !Number.isInteger(quantity) || quantity <= 0)) {
      setError("Select at least one product and enter a whole quantity greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await bulkAddStock(updates);
      onUpdated(response.data);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update stock. Please try again.");
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 bg-black/35" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="ml-auto flex h-full w-full max-w-[780px] flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="quantity-update-title">
      <header className="flex items-center justify-between border-b border-[#eee] px-5 py-4 sm:px-7"><h2 id="quantity-update-title" className="m-0 text-xl font-semibold text-[#111]">Quantity Update</h2><button type="button" onClick={onClose} className="grid h-10 w-10 cursor-pointer place-items-center border-0 bg-transparent text-[#222]" aria-label="Close quantity update"><X size={27} /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
        <label className="flex h-11 items-center gap-2 rounded-md border border-[#ddd] px-3"><Search size={17} className="text-[#777]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 border-0 text-sm outline-none" placeholder="Search products" /></label>
        <p className="mb-3 mt-5 text-sm font-medium text-[#333]">Select products and enter stock to add</p>
        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]"><table className="w-full min-w-[650px] border-collapse text-sm"><thead><tr className="border-b border-[#e5e5e5] text-left text-[#555]"><th className="w-12 px-4 py-3"><span className="sr-only">Select</span></th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Current Stock</th><th className="px-4 py-3">Add Stock</th><th className="px-4 py-3">New Stock</th></tr></thead><tbody>{visibleProducts.map((product) => { const currentStock = stockOf(product); const addition = Number(quantities[product._id]) || 0; const isSelected = selected.includes(product._id); return <tr key={product._id} className="border-b border-[#f3f3f3] last:border-0"><td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleProduct(product._id)} className="h-4 w-4 accent-[#2f7a3c]" /></td><td className="px-4 py-3"><p className="m-0 font-medium text-[#222]">{product.productName}</p><p className="m-0 text-xs text-[#777]">{product.productId || product.inventory?.sku || "—"}</p></td><td className="px-4 py-3">{currentStock}</td><td className="px-4 py-3"><input type="number" min="1" step="1" disabled={!isSelected} value={quantities[product._id] ?? ""} onChange={(event) => setQuantities((current) => ({ ...current, [product._id]: event.target.value }))} className="h-10 w-24 rounded-md border border-[#d9d9d9] px-3 outline-none focus:border-[#4f9d5d] disabled:cursor-not-allowed disabled:bg-[#f5f5f5]" aria-label={`Stock to add for ${product.productName}`} /></td><td className="px-4 py-3">{isSelected ? currentStock + addition : currentStock}</td></tr>; })}{visibleProducts.length === 0 && <tr><td colSpan="5" className="px-4 py-10 text-center text-[#777]">No products found.</td></tr>}</tbody></table></div>
        {error && <p className="mt-4 rounded-md bg-[#fdecea] px-3 py-2 text-sm text-[#c93636]" role="alert">{error}</p>}
      </div>
      <footer className="flex flex-col-reverse gap-3 border-t border-[#eee] p-4 sm:flex-row sm:justify-end sm:p-5"><button type="button" onClick={onClose} disabled={saving} className="h-11 cursor-pointer rounded-md border border-[#222] bg-white px-7 font-semibold text-[#222] disabled:opacity-60">Cancel</button><button type="button" onClick={save} disabled={saving} className="h-11 cursor-pointer rounded-md border border-[#2f9636] bg-[#2f9636] px-7 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Updating..." : "Update Stock"}</button></footer>
    </section>
  </div>;
}
