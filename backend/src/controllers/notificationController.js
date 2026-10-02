import { supabase } from "../config/supabase.js";
import { syncSellerNotifications } from "../services/notifications.js";

const userIdForSeller = async (sellerId) => {
  const { data, error } = await supabase.from("seller_applications").select("user_id").eq("id", sellerId).maybeSingle();
  if (error) throw error;
  return data?.user_id || null;
};

export const getNotifications = async (req, res, next) => {
  try {
    await syncSellerNotifications(req.seller.id);
    const userId = await userIdForSeller(req.seller.id);
    if (!userId) return res.json({ success: true, data: [], unreadCount: 0 });
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).eq("audience", "seller").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    const notifications = data ?? [];
    return res.json({ success: true, data: notifications, unreadCount: notifications.filter((item) => !item.is_read).length });
  } catch (error) { return next(error); }
};

export const markNotificationsRead = async (req, res, next) => {
  try {
    const userId = await userIdForSeller(req.seller.id);
    if (!userId) return res.json({ success: true });
    const ids = req.body?.ids;
    let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("audience", "seller").eq("is_read", false);
    if (Array.isArray(ids) && ids.length) query = query.in("id", ids);
    const { error } = await query;
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) { return next(error); }
};
