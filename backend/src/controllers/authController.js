import { supabase } from "../config/supabase.js";
import { createSellerToken } from "../middlewares/sellerAuth.js";
import { recordSellerLogin } from "../services/notifications.js";

export const loginSeller = async (req, res, next) => {
  try {
    const sellerCode = String(req.body?.sellerCode || "").trim().toUpperCase();
    const password = String(req.body?.password || "");

    if (!sellerCode || !password) {
      return res.status(400).json({ success: false, message: "Seller code and password are required." });
    }

    if (!process.env.SELLER_PASSWORD_ENCRYPTION_KEY) {
      const error = new Error("SELLER_PASSWORD_ENCRYPTION_KEY must be set in backend/.env");
      error.status = 503;
      throw error;
    }

    const { data, error } = await supabase.rpc("authenticate_seller", {
      p_seller_code: sellerCode,
      p_password: password,
      p_encryption_key: process.env.SELLER_PASSWORD_ENCRYPTION_KEY,
    });

    if (error) throw error;
    const seller = data?.[0];
    if (!seller) {
      return res.status(401).json({ success: false, message: "Invalid seller code or password." });
    }
    if (!seller.application_id) {
      const error = new Error("This seller account has no application ID and cannot manage products.");
      error.status = 403;
      throw error;
    }

    // Notifications must never block a valid sign-in if the migration has not
    // been applied yet or an older seller profile has no linked auth user.
    try { await recordSellerLogin(seller.application_id); } catch (notificationError) { console.error("Unable to record seller login notification:", notificationError.message); }

    return res.json({
      success: true,
      seller: {
        sellerId: seller.application_id,
        sellerCode: seller.seller_code,
        username: seller.username,
        applicationId: seller.application_id,
      },
      token: createSellerToken(seller),
    });
  } catch (error) {
    return next(error);
  }
};
