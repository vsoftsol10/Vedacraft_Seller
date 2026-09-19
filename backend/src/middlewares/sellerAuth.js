import crypto from "crypto";

const tokenSecret = () => process.env.SELLER_SESSION_SECRET || process.env.SELLER_PASSWORD_ENCRYPTION_KEY;

const sign = (value) => crypto.createHmac("sha256", tokenSecret()).update(value).digest("base64url");

export const createSellerToken = (seller) => {
  const payload = Buffer.from(JSON.stringify({
    sellerId: seller.application_id,
    sellerCode: seller.seller_code,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

export const requireSeller = (req, res, next) => {
  try {
    if (!tokenSecret()) {
      const error = new Error("SELLER_SESSION_SECRET or SELLER_PASSWORD_ENCRYPTION_KEY must be set in backend/.env");
      error.status = 503;
      throw error;
    }

    const [scheme, token] = String(req.headers.authorization || "").split(" ");
    const [payload, signature] = String(token || "").split(".");
    if (scheme !== "Bearer" || !payload || !signature) throw Object.assign(new Error("Sign in is required."), { status: 401 });

    const expectedSignature = sign(payload);
    const valid = signature.length === expectedSignature.length
      && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    if (!valid) throw Object.assign(new Error("Your session is invalid. Please sign in again."), { status: 401 });

    const seller = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!seller.sellerId || !seller.exp || seller.exp < Math.floor(Date.now() / 1000)) {
      throw Object.assign(new Error("Your session has expired. Please sign in again."), { status: 401 });
    }
    req.seller = { id: seller.sellerId, sellerCode: seller.sellerCode };
    return next();
  } catch (error) {
    if (!error.status) error.status = 401;
    return next(error);
  }
};
