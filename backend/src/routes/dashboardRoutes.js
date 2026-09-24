import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);
router.get("/", getDashboardSummary);
export default router;
