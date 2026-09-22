import { Router } from "express";
import { getBusiness, updateBusiness } from "../controllers/businessController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();

router.use(requireSeller);
router.get("/", getBusiness);
router.put("/", updateBusiness);

export default router;
