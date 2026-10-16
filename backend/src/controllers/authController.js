import { supabase } from "../config/supabase.js";
import crypto from "node:crypto";
import { createSellerToken } from "../middlewares/sellerAuth.js";
import { recordSellerLogin } from "../services/notifications.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resetRequestMessage = "If that email belongs to a seller account, we have sent a password-reset link.";
const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const escapeHtml = (value) => String(value || "").replace(/[&<>'\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

const resetLinkFor = (token) => {
  const clientUrl = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim();
  const url = new URL("/reset-password", clientUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

const sendResetEmail = async ({ email, name, token }) => {
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME = "VedaCrafts" } = process.env;
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    const error = new Error("BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in backend/.env");
    error.status = 503;
    throw error;
  }

  const resetLink = resetLinkFor(token);
  const safeName = escapeHtml(name);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
      to: [{ email, name: name || undefined }],
      subject: "Reset your VedaCrafts seller password",
      htmlContent: `<p>Hello${safeName ? ` ${safeName}` : ""},</p><p>We received a request to reset your VedaCrafts seller password.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in 30 minutes and can be used once. If you did not request it, you can safely ignore this email.</p>`,
    }),
  });
  if (!response.ok) {
    const details = await response.text();
    const error = new Error(`Brevo could not send the password-reset email (${response.status}). ${details}`);
    error.status = 502;
    throw error;
  }
};

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

export const requestPasswordReset = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    // Keep this response identical for unknown addresses to avoid exposing who has an account.
    if (!emailPattern.test(email)) return res.json({ success: true, message: resetRequestMessage });

    const { data: seller, error } = await supabase
      .from("seller_applications")
      .select("id, full_name, business_email")
      .ilike("business_email", email)
      .maybeSingle();
    if (error) throw error;
    if (!seller) return res.json({ success: true, message: resetRequestMessage });

    const { data: credential, error: credentialError } = await supabase
      .from("seller_credentials")
      .select("application_id")
      .eq("application_id", seller.id)
      .maybeSingle();
    if (credentialError) throw credentialError;
    if (!credential) return res.json({ success: true, message: resetRequestMessage });

    const token = crypto.randomBytes(32).toString("hex");
    const { error: tokenError } = await supabase.from("seller_password_reset_tokens").insert({
      seller_id: seller.id,
      token_hash: hashResetToken(token),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    if (tokenError) throw tokenError;

    await sendResetEmail({ email: seller.business_email, name: seller.full_name, token });
    return res.json({ success: true, message: resetRequestMessage });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const token = String(req.body?.token || "");
    const password = String(req.body?.password || "");
    if (!/^[a-f0-9]{64}$/i.test(token) || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: "Use a valid reset link and a password between 8 and 128 characters." });
    }
    if (!process.env.SELLER_PASSWORD_ENCRYPTION_KEY) {
      const error = new Error("SELLER_PASSWORD_ENCRYPTION_KEY must be set in backend/.env");
      error.status = 503;
      throw error;
    }
    const { data, error } = await supabase.rpc("reset_seller_password", {
      p_token_hash: hashResetToken(token),
      p_new_password: password,
      p_encryption_key: process.env.SELLER_PASSWORD_ENCRYPTION_KEY,
    });
    if (error) throw error;
    if (!data) return res.status(400).json({ success: false, message: "This reset link is invalid or has expired. Request a new one." });
    return res.json({ success: true, message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    return next(error);
  }
};
