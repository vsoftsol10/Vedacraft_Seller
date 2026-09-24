import { supabase } from "../config/supabase.js";

const ordersTable = "orders";
const productsTable = "seller_products";
const reviewsTable = "product_reviews";
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const orderCache = new Map();
const ORDER_CACHE_TTL_MS = 15_000;

const orderItems = (items) => {
  if (Array.isArray(items)) return items;
  try { return JSON.parse(items || "[]"); } catch { return []; }
};

const sellerProducts = async (sellerId) => {
  const { data, error } = await supabase.from(productsTable).select("id, product_name, cover_image").eq("seller_id", sellerId);
  if (error) throw error;
  return data ?? [];
};

// Orders have no seller_id. Their item IDs determine seller ownership, matching
// the existing Orders endpoint.
const sellerOrders = (sellerId) => {
  const cached = orderCache.get(sellerId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  // All four dashboard widgets need this same data. Caching the promise also
  // coalesces requests arriving at the same time into one Supabase read.
  const value = (async () => {
    const [products, ordersResult] = await Promise.all([
      sellerProducts(sellerId),
      supabase.from(ordersTable).select("id, items, status, created_at"),
    ]);
    if (ordersResult.error) throw ordersResult.error;
    const productIds = new Set(products.map((product) => product.id));
    return {
      products,
      orders: (ordersResult.data ?? []).filter((order) => orderItems(order.items).some((item) => productIds.has(item.id))),
    };
  })();

  orderCache.set(sellerId, { value, expiresAt: Date.now() + ORDER_CACHE_TTL_MS });
  value.catch(() => {
    if (orderCache.get(sellerId)?.value === value) orderCache.delete(sellerId);
  });
  return value;
};

const statusOf = (status) => String(status || "Placed").trim().toLowerCase();

export async function getOrderStats(sellerId) {
  const { orders } = await sellerOrders(sellerId);
  return {
    totalOrders: orders.length,
    completed: orders.filter((order) => statusOf(order.status) === "delivered").length,
    pending: orders.filter((order) => !["delivered", "cancelled", "canceled", "returned"].includes(statusOf(order.status))).length,
    cancelled: orders.filter((order) => ["cancelled", "canceled", "returned"].includes(statusOf(order.status))).length,
  };
}

export async function getOrderTrends(sellerId, year = new Date().getFullYear()) {
  const { orders } = await sellerOrders(sellerId);
  const counts = new Array(12).fill(0);
  for (const order of orders) {
    const date = new Date(order.created_at);
    if (!Number.isNaN(date.valueOf()) && date.getUTCFullYear() === year) counts[date.getUTCMonth()] += 1;
  }
  return monthLabels.map((month, index) => ({ month, orders: counts[index] }));
}

export async function getTopSellingProducts(sellerId, limit = 3) {
  const { products, orders } = await sellerOrders(sellerId);
  return topSellingProducts(products, orders, limit);
}

const topSellingProducts = (products, orders, limit) => {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const quantities = new Map();
  for (const order of orders) {
    for (const item of orderItems(order.items)) {
      if (!productsById.has(item.id)) continue;
      quantities.set(item.id, (quantities.get(item.id) ?? 0) + (Number(item.quantity) || 1));
    }
  }
  return [...quantities.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, Math.max(1, Math.min(Number(limit) || 3, 20)))
    .map(([id, orders]) => ({ name: productsById.get(id).product_name || "Unnamed product", image: productsById.get(id).cover_image || null, orders }));
};

export async function getBusinessTips(sellerId) {
  const { products, orders } = await sellerOrders(sellerId);
  const topProducts = topSellingProducts(products, orders, 1);
  const productIds = products.map((product) => product.id);
  let averageRating = 0;
  if (productIds.length) {
    const { data, error } = await supabase.from(reviewsTable).select("rating").in("product_id", productIds);
    if (error) throw error;
    if (data?.length) averageRating = data.reduce((total, review) => total + (Number(review.rating) || 0), 0) / data.length;
  }

  const now = new Date();
  const thisMonth = orders.filter((order) => { const date = new Date(order.created_at); return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth(); }).length;
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonth = orders.filter((order) => { const date = new Date(order.created_at); return date.getUTCFullYear() === previous.getUTCFullYear() && date.getUTCMonth() === previous.getUTCMonth(); }).length;
  const growth = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth ? 100 : 0);
  const image = topProducts[0]?.image ?? null;

  return [
    topProducts[0] && { title: topProducts[0].name, description: "Personalized tips to help you grow your store", image },
    { title: growth >= 0 ? "Your orders are growing" : "Your orders dipped", description: growth >= 0 ? `Your orders increased by ${growth}% this month. Consider keeping your popular product well stocked.` : `Your orders dropped ${Math.abs(growth)}% this month. Consider running a promotion.`, image },
    { title: averageRating >= 4.5 ? "Maintain your great rating" : "Improve your rating", description: `Your customer rating is ${averageRating.toFixed(1)}/5. Continue responding to customer feedback to keep the momentum.`, image },
  ].filter(Boolean);
}

// The page's initial render needs every widget. Serving that as one response
// avoids four HTTP round trips and lets all calculations share the cached order set.
export async function getInsightSummary(sellerId, year) {
  const [stats, trends, topProducts, businessTips] = await Promise.all([
    getOrderStats(sellerId),
    getOrderTrends(sellerId, year),
    getTopSellingProducts(sellerId, 3),
    getBusinessTips(sellerId),
  ]);
  return { stats, trends, topProducts, businessTips };
}
