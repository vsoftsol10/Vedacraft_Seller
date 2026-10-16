import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginSeller, requestPasswordReset, resetPassword } from "../controllers/authController.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Please try again in 15 minutes." },
});

router.post("/login", loginLimiter, loginSeller);
router.post("/forgot-password", rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false }), requestPasswordReset);
router.post("/reset-password", rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false }), resetPassword);

export default router;
