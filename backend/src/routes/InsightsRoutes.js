import { Router } from "express";
import * as insightsController from "../controllers/InsightsController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);

router.get("/summary", insightsController.getSummary);
router.get("/stats", insightsController.getStats);
router.get("/order-trends", insightsController.getOrderTrends);
router.get("/top-products", insightsController.getTopSellingProducts);
router.get("/business-tips", insightsController.getBusinessTips);

export default router;
