import api from "./productapi";

const summaryCache = new Map();
const SUMMARY_CACHE_TTL_MS = 15_000;

function fetchInsightSummary(year = new Date().getFullYear()) {
  const cached = summaryCache.get(year);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = api
    .get("/insights/summary", { params: { year } })
    .then(({ data }) => data.data ?? data);
  summaryCache.set(year, { value, expiresAt: Date.now() + SUMMARY_CACHE_TTL_MS });
  value.catch(() => {
    if (summaryCache.get(year)?.value === value) summaryCache.delete(year);
  });
  return value;
}

export async function fetchInsightStats() {
  const data = await fetchInsightSummary();
  return data.stats;
}

export async function fetchOrderTrends(year) {
  const data = await fetchInsightSummary(year);
  return data.trends;
}

export async function fetchTopSellingProducts(limit = 3) {
  const data = await fetchInsightSummary();
  return data.topProducts.slice(0, limit);
}

export async function fetchBusinessTips() {
  const data = await fetchInsightSummary();
  return data.businessTips;
}
