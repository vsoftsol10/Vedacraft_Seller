import { useMemo, useState } from "react";
import { Search, X, CheckCircle2, AlertCircle, AlertTriangle, LoaderCircle } from "lucide-react";
import { bulkAddStock } from "../../api/productapi";

const stockOf = (product) => Number(product.inventory?.stockQuantity ?? product.stockQuantity ?? product.quantity ?? product.stock ?? 0);

export default function BulkQuantityUpdate({ products, onClose, onUpdated }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [failedItems, setFailedItems] = useState([]);

  const visibleProducts = useMemo(() => products.filter((product) =>
    [product.productId, product.productName, product.inventory?.sku].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [products, query]);

  const chosenProducts = products.filter((product) => selected.includes(product._id));

  const toggleProduct = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setError("");
    setSuccessMessage("");
    setFailedItems((current) => current.filter((item) => item.id !== id));
  };

  const save = async () => {
    if (saving) return; // Prevent repeated double submissions

    const updates = chosenProducts.map((product) => ({
      id: product._id,
      productName: product.productName,
      quantity: Number(quantities[product._id])
    }));

    if (!updates.length) {
      setError("Select at least one product and enter a quantity.");
      return;
    }

    const invalidInputs = updates.filter(({ quantity }) => !Number.isInteger(quantity) || quantity <= 0);
    if (invalidInputs.length > 0) {
      setError("Each stock quantity must be a whole number greater than zero.");
      setFailedItems(invalidInputs.map((item) => ({
        id: item.id,
        productName: item.productName,
        reason: "Quantity must be a positive whole integer."
      })));
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");
    setFailedItems([]);

    try {
      const response = await bulkAddStock(updates);

      if (response?.success) {
        setSuccessMessage(response.message || `All ${updates.length} products updated successfully!`);
        setQuantities({});
        setSelected([]);

        if (onUpdated) {
          onUpdated(response.data);
        }

        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (requestError) {
      const data = requestError.response?.data;
      const genericMsg = data?.message || "Unable to update stock. Please try again.";
      setError(genericMsg);

      if (Array.isArray(data?.failed) && data.failed.length > 0) {
        setFailedItems(data.failed);
      } else {
        setFailedItems(updates.map((u) => ({
          id: u.id,
          productName: u.productName,
          reason: genericMsg
        })));
      }
    } finally {
      setSaving(false);
    }
  };

  const getFailureReason = (id) => {
    const found = failedItems.find((f) => f.id === id);
    return found ? found.reason : null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="flex h-full w-full max-w-[820px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200" role="dialog" aria-modal="true" aria-labelledby="quantity-update-title">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#eee] px-5 py-4 sm:px-7">
          <div>
            <h2 id="quantity-update-title" className="m-0 text-xl font-bold text-[#111]">Bulk Quantity Update</h2>
            <p className="mt-0.5 text-xs text-gray-500">Atomic update — all valid items update together. If any item fails, no stock is modified.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-[#666] hover:bg-gray-100 hover:text-black disabled:opacity-40 transition-colors"
            aria-label="Close quantity update"
          >
            <X size={22} />
          </button>
        </header>

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
          {/* Search bar */}
          <label className="flex h-11 items-center gap-2 rounded-lg border border-[#ddd] bg-[#fafafa] px-3 focus-within:border-[#2f7a3c] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2f7a3c]/15 transition-all">
            <Search size={17} className="text-[#888] shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="Search products by title, ID or SKU..."
            />
          </label>

          {/* Alert Status Banners */}
          {successMessage && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3.5 text-sm text-green-900 animate-in fade-in">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900 animate-in fade-in" role="alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="m-0 font-semibold">{error}</p>
                  <p className="mt-1 text-xs text-red-700">Atomic transaction guaranteed: zero stock changes were saved to the database.</p>
                </div>
              </div>
            </div>
          )}

          {/* Failed Items Breakdown List */}
          {failedItems.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Per-Product Failure Details ({failedItems.length}):</span>
              </div>
              <ul className="mt-2 space-y-1.5 pl-5 text-xs text-amber-950 list-disc">
                {failedItems.map((f, idx) => (
                  <li key={`${f.id}-${idx}`}>
                    <span className="font-semibold">{f.productName || f.id}:</span> {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mb-3 mt-5 text-sm font-semibold text-[#333]">
            Select products and enter quantity to add:
          </p>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
            <table className="w-full min-w-[650px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-semibold text-[#555] uppercase tracking-wider">
                  <th className="w-12 px-4 py-3"><span className="sr-only">Select</span></th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Add Stock</th>
                  <th className="px-4 py-3">New Stock</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {visibleProducts.map((product) => {
                  const currentStock = stockOf(product);
                  const addition = Number(quantities[product._id]) || 0;
                  const isSelected = selected.includes(product._id);
                  const failureReason = getFailureReason(product._id);

                  return (
                    <tr key={product._id} className={`transition-colors ${isSelected ? "bg-[#f9fcf9]" : "hover:bg-gray-50/60"} ${failureReason ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product._id)}
                          disabled={saving}
                          className="h-4 w-4 rounded accent-[#2f7a3c] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="m-0 font-medium text-gray-900">{product.productName}</p>
                        <p className="m-0 text-xs text-gray-500">{product.productId || product.inventory?.sku || "—"}</p>
                        {failureReason && (
                          <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
                            <AlertCircle size={12} className="shrink-0" />
                            {failureReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{currentStock}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          disabled={!isSelected || saving}
                          value={quantities[product._id] ?? ""}
                          onChange={(event) => {
                            setQuantities((current) => ({ ...current, [product._id]: event.target.value }));
                            setError("");
                            setFailedItems((current) => current.filter((item) => item.id !== product._id));
                          }}
                          className={`h-10 w-24 rounded-lg border px-3 text-sm outline-none transition-all ${
                            failureReason
                              ? "border-red-400 bg-red-50/50 text-red-900 focus:border-red-600"
                              : "border-[#d9d9d9] bg-white text-gray-900 focus:border-[#4f9d5d] focus:ring-2 focus:ring-[#4f9d5d]/20"
                          } disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-gray-400`}
                          placeholder="+0"
                          aria-label={`Stock to add for ${product.productName}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {isSelected && addition > 0 ? (
                          <span className="text-emerald-700 font-bold">{currentStock + addition}</span>
                        ) : (
                          currentStock
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.stockStatus === "In Stock" ? "bg-green-100 text-green-800" :
                          product.stockStatus === "Low Stock" ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {product.stockStatus || "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                      No matching products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col-reverse gap-3 border-t border-[#eee] bg-gray-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="text-xs text-gray-500">
            {selected.length > 0 ? (
              <span><strong>{selected.length}</strong> {selected.length === 1 ? "product" : "products"} selected</span>
            ) : (
              <span>Select products to update stock</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 cursor-pointer rounded-lg border border-gray-300 bg-white px-6 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || selected.length === 0}
              className="h-11 min-w-[140px] cursor-pointer rounded-lg border-0 bg-[#2f9636] px-6 font-semibold text-white hover:bg-[#26802c] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                "Update Stock"
              )}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
