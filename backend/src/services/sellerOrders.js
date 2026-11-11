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
//
// Security: only the columns needed for fulfilment are fetched (no customer
// e-mail, raw payment credentials, or other sellers' data). Each order's
// `items` array is narrowed to the products that belong to this seller so a
// seller cannot see another seller's line items in a shared basket.
export const getSellerOrders = async (sellerId) => {
  const [{ data: products, error: productsError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from(productsTable).select("id").eq("seller_id", sellerId),
    supabase
      .from(ordersTable)
      .select("id, order_number, created_at, status, delivered_at, items, address, total, payment_method, product, item_count")
      .order("created_at", { ascending: false }),
  ]);
  if (productsError) throw productsError;
  if (ordersError) throw ordersError;

  const productIds = new Set((products ?? []).map(({ id }) => id));

  const sellerOrders = (orders ?? [])
    .filter((order) => matchedSellerItems(order, productIds).length > 0)
    .map((order) => ({
      ...order,
      // Replace the full items array with only this seller's own line items so
      // products belonging to other sellers in the same basket are never exposed.
      items: matchedSellerItems(order, productIds),
    }));

  return { productIds, orders: sellerOrders };
};
