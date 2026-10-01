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
import { getSellerOrders, matchedSellerItems } from "../services/sellerOrders.js";

const ordersTable = "orders";
const sellersTable = "seller_applications";

const ORDER_STATUS_SEQUENCE = ["Placed", "Processing", "Packed", "Shipped", "Delivered"];
const EDITABLE_STATUSES = ORDER_STATUS_SEQUENCE.slice(1);

const canonicalStatus = (value) => {
  const normalized = String(value ?? "Placed").trim().toLowerCase();
  return ORDER_STATUS_SEQUENCE.find((candidate) => candidate.toLowerCase() === normalized) ?? null;
};

export const getOrders = async (req, res, next) => {
  try {
    // Orders store product snapshots in `items`. Match those product IDs to the
    // signed-in seller's products so a seller only receives their own orders.
    const [{ orders }, { data: seller, error: sellerError }] = await Promise.all([
      getSellerOrders(req.seller.id),
      supabase.from(sellersTable).select("full_name, business_name, store_name, address_line1, city, state, pin_code, country").eq("id", req.seller.id).maybeSingle(),
    ]);
    if (sellerError) throw sellerError;

    const returnAddress = seller ? {
      name: seller.store_name || seller.business_name || seller.full_name || "Seller",
      address1: seller.address_line1 || "",
      city: seller.city || "",
      state: seller.state || "",
      pinCode: seller.pin_code || "",
      country: seller.country || "",
    } : null;
    return res.json({ success: true, data: orders.map((order) => ({ ...order, return_address: returnAddress })) });
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
    const [{ productIds }, { data: order, error: orderError }] = await Promise.all([
      getSellerOrders(req.seller.id),
      supabase.from(ordersTable).select("*").eq("id", req.params.id).maybeSingle(),
    ]);
    if (orderError) throw orderError;
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const owned = matchedSellerItems(order, productIds).length > 0;
    if (!owned) return res.status(404).json({ success: false, message: "Order not found" });

    const currentStatus = canonicalStatus(order.status);
    const requestedIndex = ORDER_STATUS_SEQUENCE.indexOf(status);
    const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(currentStatus);
    if (currentIndex === -1) {
      return res.status(409).json({ success: false, message: "This order has an unsupported status and cannot be updated." });
    }
    if (requestedIndex !== currentIndex + 1) {
      const nextStatus = ORDER_STATUS_SEQUENCE[currentIndex + 1];
      const message = nextStatus
        ? `Order status can only move forward from ${currentStatus} to ${nextStatus}.`
        : "Delivered orders cannot be updated further.";
      return res.status(409).json({ success: false, message });
    }

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
