import { Router } from "express";
import { getNotifications, markNotificationsRead } from "../controllers/notificationController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);
router.get("/", getNotifications);
router.patch("/read", markNotificationsRead);
export default router;
