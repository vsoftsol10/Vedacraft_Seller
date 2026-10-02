import { supabase } from "../config/supabase.js";
import { getSellerOrders } from "./sellerOrders.js";

const notificationsTable = "notifications";

const sellerUserId = async (sellerId) => {
  const { data, error } = await supabase.from("seller_applications").select("user_id").eq("id", sellerId).maybeSingle();
  if (error) throw error;
  return data?.user_id || null;
};

const notificationExists = async (userId, type, message, orderId = null) => {
  let query = supabase.from(notificationsTable).select("id").eq("user_id", userId).eq("type", type).eq("message", message).limit(1);
  query = orderId ? query.eq("order_id", orderId) : query.is("order_id", null);
  const { data, error } = await query;
  if (error) throw error;
  return Boolean(data?.length);
};

export const createSellerNotification = async (sellerId, notification, { markRead = false, deduplicate = true } = {}) => {
  const userId = await sellerUserId(sellerId);
  if (!userId) return null;
  const message = String(notification.message).trim();
  if (deduplicate && await notificationExists(userId, notification.type, message, notification.orderId)) return null;
  const { data, error } = await supabase.from(notificationsTable).insert({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    message,
    order_id: notification.orderId || null,
    is_read: markRead,
  }).select().single();
  if (error) throw error;
  return data;
};

const offerNotification = (offer, now) => {
  const start = offer.start_date ? new Date(offer.start_date) : null;
  const end = offer.end_date ? new Date(offer.end_date) : null;
  const tomorrowStart = new Date(now); tomorrowStart.setUTCHours(24, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
  const name = offer.offer_name;
  if (end && end <= now) return { type: "offer_ended", title: "Offer ended", message: `Your offer \"${name}\" has ended.` };
  if (start && start >= tomorrowStart && start < tomorrowEnd) return { type: "offer_starts_tomorrow", title: "Offer starts tomorrow", message: `Your offer \"${name}\" starts tomorrow.` };
  if (offer.is_active && (!start || start <= now) && (!end || end > now)) return { type: "offer_active", title: "Offer is active", message: `Your offer \"${name}\" is now active.` };
  return null;
};

export const syncSellerNotifications = async (sellerId, { markExistingOrdersRead = false } = {}) => {
  const userId = await sellerUserId(sellerId);
  if (!userId) return [];
  const created = [];
  const now = new Date();
  const [{ data: offers, error: offersError }, { orders }] = await Promise.all([
    supabase.from("offers").select("offer_name, start_date, end_date, is_active").eq("seller_id", sellerId),
    getSellerOrders(sellerId),
  ]);
  if (offersError) throw offersError;

  for (const offer of offers ?? []) {
    const notification = offerNotification(offer, now);
    if (notification) {
      const item = await createSellerNotification(sellerId, notification);
      if (item) created.push(item);
    }
  }
  for (const order of orders ?? []) {
    const item = await createSellerNotification(sellerId, {
      type: "order",
      title: "New order received",
      message: `You received order #${String(order.id).slice(0, 8).toUpperCase()}.`,
      orderId: order.id,
    }, { markRead: markExistingOrdersRead });
    if (item) created.push(item);
  }
  return created;
};

export const recordSellerLogin = async (sellerId) => {
  const userId = await sellerUserId(sellerId);
  if (!userId) return;
  const { data: previousLogins, error } = await supabase.from(notificationsTable)
    .select("created_at").eq("user_id", userId).eq("type", "login").order("created_at", { ascending: false }).limit(1);
  if (error) throw error;
  await createSellerNotification(sellerId, {
    type: "login",
    title: "Welcome back",
    message: "You signed in to your seller account.",
  }, { deduplicate: false });
  await syncSellerNotifications(sellerId, { markExistingOrdersRead: !previousLogins?.length });
};
