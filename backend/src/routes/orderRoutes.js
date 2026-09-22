import { Router } from "express";
import { getOrders, updateOrderStatus } from "../controllers/orderController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);
router.get("/", getOrders);
router.patch("/:id/status", updateOrderStatus);
export default router;
