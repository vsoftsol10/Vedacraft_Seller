// import { supabase } from "../config/supabase.js";

// const ordersTable = "orders";
// const productsTable = "seller_products";

// const orderItems = (items) => {
//   if (Array.isArray(items)) return items;
//   try { return JSON.parse(items || "[]"); } catch { return []; }
// };

// export const getOrders = async (req, res, next) => {
//   try {
//     // Orders store product snapshots in `items`. Match those product IDs to the
//     // signed-in seller's products so a seller only receives their own orders.
//     const [{ data: products, error: productsError }, { data: orders, error: ordersError }] = await Promise.all([
//       supabase.from(productsTable).select("id").eq("seller_id", req.seller.id),
//       supabase.from(ordersTable).select("*").order("created_at", { ascending: false }),
//     ]);
//     if (productsError) throw productsError;
//     if (ordersError) throw ordersError;

//     const productIds = new Set((products ?? []).map(({ id }) => id));
//     const sellerOrders = (orders ?? []).filter((order) => orderItems(order.items).some((item) => productIds.has(item.id)));
//     return res.json({ success: true, data: sellerOrders });
//   } catch (error) {
//     return next(error);
//   }
// };

import { supabase } from "../config/supabase.js";

const ordersTable = "orders";
const productsTable = "seller_products";

const EDITABLE_STATUSES = ["Processing", "Packed", "Shipped", "Delivered"];

const orderItems = (items) => {
  if (Array.isArray(items)) return items;
  try { return JSON.parse(items || "[]"); } catch { return []; }
};

export const getOrders = async (req, res, next) => {
  try {
    // Orders store product snapshots in `items`. Match those product IDs to the
    // signed-in seller's products so a seller only receives their own orders.
    const [{ data: products, error: productsError }, { data: orders, error: ordersError }] = await Promise.all([
      supabase.from(productsTable).select("id").eq("seller_id", req.seller.id),
      supabase.from(ordersTable).select("*").order("created_at", { ascending: false }),
    ]);
    if (productsError) throw productsError;
    if (ordersError) throw ordersError;

    const productIds = new Set((products ?? []).map(({ id }) => id));
    const sellerOrders = (orders ?? []).filter((order) => orderItems(order.items).some((item) => productIds.has(item.id)));
    return res.json({ success: true, data: sellerOrders });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!EDITABLE_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of ${EDITABLE_STATUSES.join(", ")}` });
    }

    // Confirm the order belongs to this seller before updating (same ownership
    // check as getOrders, since `orders` has no seller_id column of its own).
    const [{ data: products, error: productsError }, { data: order, error: orderError }] = await Promise.all([
      supabase.from(productsTable).select("id").eq("seller_id", req.seller.id),
      supabase.from(ordersTable).select("*").eq("id", req.params.id).maybeSingle(),
    ]);
    if (productsError) throw productsError;
    if (orderError) throw orderError;
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const productIds = new Set((products ?? []).map(({ id }) => id));
    const owned = orderItems(order.items).some((item) => productIds.has(item.id));
    if (!owned) return res.status(404).json({ success: false, message: "Order not found" });

    const updates = { status };
    // Record the first time the seller marks an order as delivered. Do not
    // clear it on later status changes so the delivery date remains auditable.
    if (status === "Delivered" && !order.delivered_at) {
      updates.delivered_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from(ordersTable).update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
    
  }
};
