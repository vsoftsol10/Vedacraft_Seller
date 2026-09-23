import { Router } from "express";
import { getReviews, getReviewStats } from "../controllers/reviewController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();

router.use(requireSeller);
router.get("/stats", getReviewStats);
router.get("/", getReviews);

export default router;
