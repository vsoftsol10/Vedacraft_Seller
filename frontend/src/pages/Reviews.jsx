import { useEffect, useState } from "react";
import { HelpCircle, Star } from "lucide-react";
import { getProducts } from "../api/productapi";
import { fetchReviews, fetchReviewStats } from "../api/reviewapi";

const STAR_FILTERS = [{ key: "all", label: "All" }, { key: 5, label: "5 Star" }, { key: 4, label: "4 Star" }, { key: 3, label: "3 Star" }, { key: 2, label: "2 Star" }, { key: 1, label: "1 Star" }];
const EMPTY_STATS = { averageRating: 0, totalReviews: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
const errorMessage = (error) => error?.response?.data?.message || (error?.request && !error?.response ? "Cannot reach the server. Check your connection and try again." : null) || error?.message || "Unable to load reviews. Please try again.";

function StatCard({ label, value, hint }) {
  return <div className="flex flex-1 items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><HelpCircle size={15} /></span><div className="flex flex-col gap-1"><span className="text-sm text-gray-600">{label}</span>{hint ? <span className="flex items-center gap-1 text-xl font-semibold text-gray-900">{value} <Star size={16} className="fill-amber-400 text-amber-400" /></span> : <span className="text-xl font-semibold text-gray-900">{value}</span>}</div></div>;
}

function RatingBar({ stars, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return <div className="flex items-center gap-3 text-xs text-gray-600"><span className="w-10 shrink-0">{stars} Star</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></div><span className="w-16 shrink-0 text-right">{count} ({pct}%)</span></div>;
}

function StarRow({ rating, size = 15 }) {
  return <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />)}</div>;
}

function ReviewCard({ review }) {
  const imageUrl = Array.isArray(review.imageUrls) ? review.imageUrls[0] : null;
  const createdAt = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : null;
  return <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">{review.customerName?.[0]?.toUpperCase() || "?"}</span><div><p className="m-0 text-sm font-semibold text-gray-900">{review.customerName}</p><StarRow rating={review.rating} /></div></div><div className="mt-3 flex gap-3">{imageUrl ? <img src={imageUrl} alt="Customer review" className="h-14 w-14 shrink-0 rounded-md object-cover" /> : <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100" />}<div className="flex flex-col justify-center gap-0.5">{review.title && <p className="m-0 text-sm font-semibold text-gray-900">{review.title}</p>}{review.productName && <p className="m-0 text-xs text-gray-500">{review.productName}</p>}</div></div>{review.reviewText && <p className="mb-0 mt-3 text-sm leading-relaxed text-gray-700">{review.reviewText}</p>}{createdAt && <p className="m-0 mt-2 text-xs text-gray-400">{createdAt}</p>}</div>;
}

export default function Reviews() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [productId, setProductId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => { try { const data = await fetchReviewStats(); if (!cancelled) { setStats(data); setStatsError(""); } } catch (error) { if (!cancelled) setStatsError(errorMessage(error)); } finally { if (!cancelled) setStatsLoading(false); } })();
    return () => { cancelled = true; };
  }, [retryKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => { try { const response = await getProducts({ page: 1, limit: 100 }); if (!cancelled) setProducts(response.data ?? []); } catch { if (!cancelled) setProducts([]); } })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReviewsLoading(true);
      try {
        const params = { page, limit: 10 };
        if (activeFilter !== "all") params.rating = activeFilter;
        if (productId) params.productId = productId;
        if (search.trim()) params.search = search.trim();
        const response = await fetchReviews(params);
        if (!cancelled) { setReviews(response.data ?? []); setPagination(response.pagination ?? { page, limit: 10, total: 0, totalPages: 0 }); setReviewsError(""); }
      } catch (error) { if (!cancelled) setReviewsError(errorMessage(error)); } finally { if (!cancelled) setReviewsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [activeFilter, page, productId, retryKey, search]);

  const changeFilter = (filter) => { setActiveFilter(filter); setPage(1); };
  const handleRetry = () => { setStatsError(""); setReviewsError(""); setStatsLoading(true); setReviewsLoading(true); setRetryKey((value) => value + 1); };
  const totalReviews = stats.totalReviews ?? 0;
  const negativeReviews = (stats.ratingBreakdown?.[1] ?? 0) + (stats.ratingBreakdown?.[2] ?? 0);
  const loadError = statsError || reviewsError;

  return <div className="flex max-w-[1100px] flex-col gap-6 pb-8 pt-2">
    <header><h1 className="m-0 text-[32px] font-bold text-gray-900">Reviews</h1><p className="mb-0 mt-1.5 text-[15px] text-gray-800">See what customers think about your products.</p></header>
    {loadError ? <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><span>{loadError}</span><button type="button" onClick={handleRetry} className="cursor-pointer rounded border border-red-300 bg-white px-3 py-1 text-red-700">Retry</button></div> : <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Average Rating" value={statsLoading ? "—" : stats.averageRating.toFixed(1)} hint /><StatCard label="Total Reviews" value={statsLoading ? "—" : totalReviews.toLocaleString()} /><StatCard label="5 Star Reviews" value={statsLoading ? "—" : stats.ratingBreakdown?.[5] ?? 0} /><StatCard label="1–2 Star Reviews" value={statsLoading ? "—" : negativeReviews} /></div>
      <section className="rounded-xl border border-gray-200 bg-white p-4"><h2 className="m-0 mb-3 text-sm font-semibold text-gray-900">Rating Distribution</h2><div className="flex flex-col gap-2.5">{[5, 4, 3, 2, 1].map((stars) => <RatingBar key={stars} stars={stars} count={stats.ratingBreakdown?.[stars] || 0} total={totalReviews} />)}</div></section>
      <div className="flex flex-wrap gap-2">{STAR_FILTERS.map(({ key, label }) => <button key={key} type="button" onClick={() => changeFilter(key)} className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${activeFilter === key ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}>{label}</button>)}</div>
      <div className="flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search reviews or customers" className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-green-600 focus:outline-none" /><select value={productId} onChange={(event) => { setProductId(event.target.value); setPage(1); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-none"><option value="">All products</option>{products.map((product) => <option key={product.id} value={product.id}>{product.productName}</option>)}</select></div>
      <div className="flex flex-col gap-3">{reviewsLoading ? [0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />) : reviews.length === 0 ? <p className="m-0 py-10 text-center text-sm text-gray-500">{totalReviews === 0 ? "No reviews yet" : "No reviews match these filters."}</p> : reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
      {pagination.totalPages > 1 && <div className="flex items-center justify-between text-sm text-gray-600"><span>Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => value - 1)} disabled={page <= 1} className="rounded border border-gray-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><button type="button" onClick={() => setPage((value) => value + 1)} disabled={page >= pagination.totalPages} className="rounded border border-gray-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></div>}
    </>}
  </div>;
}
