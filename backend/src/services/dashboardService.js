import { supabase } from "../config/supabase.js";

const productsTable = "seller_products";
const ordersTable = "orders";
const reviewsTable = "product_reviews";
const cache = new Map();
const CACHE_TTL_MS = 15_000;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const itemsFrom = (items) => {
  if (Array.isArray(items)) return items;
  try { return JSON.parse(items || "[]"); } catch { return []; }
};
const number = (value) => Number(value) || 0;
const isCancelled = (status) => ["cancelled", "canceled", "returned"].includes(String(status || "").toLowerCase());

const percentChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const buildDashboard = async (sellerId) => {
  const { data: products, error: productsError } = await supabase
    .from(productsTable)
    .select("id, product_name, category, stock_quantity, low_stock_alert, selling_price")
    .eq("seller_id", sellerId);
  if (productsError) throw productsError;
  const sellerProducts = products ?? [];
  const productById = new Map(sellerProducts.map((product) => [product.id, product]));
  const productIds = sellerProducts.map((product) => product.id);

  const [{ data: allOrders, error: ordersError }, reviewsResult] = await Promise.all([
    supabase.from(ordersTable).select("id, order_number, items, status, total, address, created_at").order("created_at", { ascending: false }),
    productIds.length
      ? supabase.from(reviewsTable).select("rating").in("product_id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ordersError) throw ordersError;
  if (reviewsResult.error) throw reviewsResult.error;

  const orders = (allOrders ?? []).map((order) => {
    const matchedItems = itemsFrom(order.items).filter((item) => productById.has(item.id));
    if (!matchedItems.length) return null;
    const revenue = matchedItems.reduce((sum, item) => {
      const product = productById.get(item.id);
      const unitPrice = number(item.sellingPrice ?? item.selling_price ?? item.price ?? product.selling_price);
      return sum + unitPrice * Math.max(1, number(item.quantity) || 1);
    }, 0);
    return { ...order, matchedItems, revenue };
  }).filter(Boolean);

  const validOrders = orders.filter((order) => !isCancelled(order.status));
  const now = new Date();
  const thisMonth = validOrders.filter((order) => { const date = new Date(order.created_at); return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth(); });
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonth = validOrders.filter((order) => { const date = new Date(order.created_at); return date.getUTCFullYear() === previousMonth.getUTCFullYear() && date.getUTCMonth() === previousMonth.getUTCMonth(); });
  const totalRevenue = validOrders.reduce((sum, order) => sum + order.revenue, 0);
  const averageRating = reviewsResult.data?.length
    ? reviewsResult.data.reduce((sum, review) => sum + number(review.rating), 0) / reviewsResult.data.length
    : 0;

  const monthlyRevenue = new Array(12).fill(0);
  const categoryRevenue = new Map();
  const productPerformance = new Map();
  for (const order of validOrders) {
    const date = new Date(order.created_at);
    if (date.getUTCFullYear() === now.getUTCFullYear()) monthlyRevenue[date.getUTCMonth()] += order.revenue;
    for (const item of order.matchedItems) {
      const product = productById.get(item.id);
      const quantity = Math.max(1, number(item.quantity) || 1);
      const revenue = number(item.sellingPrice ?? item.selling_price ?? item.price ?? product.selling_price) * quantity;
      categoryRevenue.set(product.category || "Uncategorized", (categoryRevenue.get(product.category || "Uncategorized") ?? 0) + revenue);
      const performance = productPerformance.get(product.id) ?? { name: product.product_name, sold: 0, revenue: 0 };
      performance.sold += quantity;
      performance.revenue += revenue;
      productPerformance.set(product.id, performance);
    }
  }

  const categoryTotal = [...categoryRevenue.values()].reduce((sum, value) => sum + value, 0);
  return {
    stats: {
      totalRevenue,
      totalOrders: validOrders.length,
      totalProducts: sellerProducts.length,
      storeRating: Number(averageRating.toFixed(1)),
      revenueChange: percentChange(thisMonth.reduce((sum, order) => sum + order.revenue, 0), lastMonth.reduce((sum, order) => sum + order.revenue, 0)),
      ordersChange: percentChange(thisMonth.length, lastMonth.length),
    },
    revenueTrend: months.map((month, index) => ({ month, value: Math.round(monthlyRevenue[index] * 100) / 100 })),
    categorySales: [...categoryRevenue.entries()].sort(([, left], [, right]) => right - left).slice(0, 4).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100, percent: categoryTotal ? Math.round((value / categoryTotal) * 100) : 0 })),
    recentOrders: orders.slice(0, 5).map((order) => {
      const address = typeof order.address === "object" && order.address ? order.address : {};
      return { id: order.order_number || `#${String(order.id).slice(0, 8).toUpperCase()}`, customer: address.fullName || "Customer", amount: order.revenue || number(order.total), status: order.status || "Placed", date: order.created_at };
    }),
    topProducts: [...productPerformance.values()].sort((left, right) => right.revenue - left.revenue).slice(0, 3),
    lowStock: sellerProducts.filter((product) => number(product.stock_quantity) <= number(product.low_stock_alert)).sort((left, right) => number(left.stock_quantity) - number(right.stock_quantity)).slice(0, 5).map((product) => ({ name: product.product_name, stock: number(product.stock_quantity) })),
  };
};

export const getDashboard = (sellerId) => {
  const current = cache.get(sellerId);
  if (current && current.expiresAt > Date.now()) return current.value;
  const value = buildDashboard(sellerId);
  cache.set(sellerId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  value.catch(() => { if (cache.get(sellerId)?.value === value) cache.delete(sellerId); });
  return value;
};
