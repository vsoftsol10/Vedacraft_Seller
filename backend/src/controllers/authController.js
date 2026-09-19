import { supabase } from "../config/supabase.js";
import { createSellerToken } from "../middlewares/sellerAuth.js";

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
