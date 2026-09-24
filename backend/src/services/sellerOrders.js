import { supabase } from "../config/supabase.js";

const ordersTable = "orders";
const productsTable = "seller_products";

export const orderItems = (items) => {
  if (Array.isArray(items)) return items;
  try { return JSON.parse(items || "[]"); } catch { return []; }
};

export const matchedSellerItems = (order, productIds) =>
  orderItems(order.items).filter((item) => productIds.has(item.id));

// Orders do not have a seller_id. Seller ownership is derived from the product
// snapshots captured in each order, so this remains the single source of truth
// for every seller-facing order read.
export const getSellerOrders = async (sellerId) => {
  const [{ data: products, error: productsError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from(productsTable).select("id").eq("seller_id", sellerId),
    supabase.from(ordersTable).select("*").order("created_at", { ascending: false }),
  ]);
  if (productsError) throw productsError;
  if (ordersError) throw ordersError;

  const productIds = new Set((products ?? []).map(({ id }) => id));
  return {
    productIds,
    orders: (orders ?? []).filter((order) => matchedSellerItems(order, productIds).length > 0),
  };
};
