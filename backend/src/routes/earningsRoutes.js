import { Router } from "express";
import { getEarnings } from "../controllers/earningsController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);
router.get("/", getEarnings);

export default router;
