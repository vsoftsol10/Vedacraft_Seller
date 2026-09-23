import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { fetchOffers, toggleOffer } from "../api/offerapi";

const STATUS_STYLES = { Active: "bg-green-100 text-green-700", Inactive: "bg-gray-100 text-gray-700", Expired: "bg-red-100 text-red-700" };
const apiError = (error, fallback) => error?.response?.data?.message || (error?.request && !error?.response ? "Cannot reach the server. Check your connection and try again." : null) || fallback;

function StatusBadge({ status }) {
  return <span className={`rounded px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={onChange} disabled={disabled} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-green-600" : "bg-gray-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button>;
}

export default function Offers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [offers, setOffers] = useState([]);
  const [query, setQuery] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const loadOffers = async () => {
    setLoading(true);
    try { const response = await fetchOffers(); setOffers(response.data ?? []); setLoadError(""); }
    catch (error) { setLoadError(apiError(error, "Unable to load offers.")); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    const loadInitialOffers = async () => {
      try {
        const response = await fetchOffers();
        if (active) { setOffers(response.data ?? []); setLoadError(""); }
      } catch (error) {
        if (active) setLoadError(apiError(error, "Unable to load offers."));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadInitialOffers();
    return () => { active = false; };
  }, []);

  const filteredOffers = useMemo(() => {
    if (!query.trim()) return offers;
    const value = query.trim().toLowerCase();
    return offers.filter((offer) => offer.offerName.toLowerCase().includes(value));
  }, [offers, query]);

  const handleToggle = async (offer) => {
    setTogglingId(offer.id);
    try { const response = await toggleOffer(offer.id, !offer.isActive); setOffers((current) => current.map((item) => item.id === offer.id ? response.data : item)); setLoadError(""); }
    catch (error) { setLoadError(apiError(error, "Unable to update offer status.")); }
    finally { setTogglingId(null); }
  };

  return <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="m-0 text-[32px] font-bold text-gray-900">Offers</h1><p className="mb-0 mt-1.5 text-[15px] text-gray-800">Create and manage discounts to boost your sales.</p></div><button type="button" onClick={() => navigate("/settings/offers/new")} className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded border border-amber-300 bg-amber-200 px-5 text-sm font-semibold text-gray-900 hover:bg-amber-300"><Plus size={16} /> Create Offer</button></header>
    <label className="flex h-11 max-w-xl items-center gap-2 rounded border border-gray-200 bg-white px-3"><Search size={16} className="shrink-0 text-gray-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search offers" className="w-full border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none" /></label>
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">{loadError ? <div className="flex items-center justify-between px-4 py-6 text-sm text-red-700"><span>{loadError}</span><button type="button" onClick={loadOffers} className="cursor-pointer rounded border border-red-300 bg-white px-3 py-1 text-red-700">Retry</button></div> : <table className="w-full min-w-[640px] border-collapse text-sm"><thead><tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500"><th className="px-4 py-3 font-semibold">Offer Name</th><th className="px-4 py-3 font-semibold">Discount</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Action</th></tr></thead><tbody>{loading ? [0, 1, 2].map((i) => <tr key={i} className="border-b border-gray-100 last:border-b-0"><td className="px-4 py-4" colSpan={4}><div className="h-4 w-full animate-pulse rounded bg-gray-100" /></td></tr>) : filteredOffers.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">{offers.length === 0 ? "No offers yet. Click “Create Offer” to add one." : "No offers match your search."}</td></tr> : filteredOffers.map((offer) => <tr key={offer.id} className="border-b border-gray-100 last:border-b-0"><td className="px-4 py-3.5 text-gray-900">{offer.offerName}</td><td className="px-4 py-3.5 text-gray-700">{offer.discountLabel}</td><td className="px-4 py-3.5"><StatusBadge status={offer.status} /></td><td className="px-4 py-3.5 text-right"><ToggleSwitch checked={offer.isActive} onChange={() => handleToggle(offer)} disabled={togglingId === offer.id || offer.status === "Expired"} /></td></tr>)}</tbody></table>}</div>
  </div>;
}
