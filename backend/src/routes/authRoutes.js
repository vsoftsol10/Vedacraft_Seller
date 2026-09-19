import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginSeller } from "../controllers/authController.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Please try again in 15 minutes." },
});

router.post("/login", loginLimiter, loginSeller);

export default router;
