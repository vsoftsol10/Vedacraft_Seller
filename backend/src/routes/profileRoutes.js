import { Router } from "express";
import { getProfile, updateProfile, updateSellingStatus } from "../controllers/profileController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";
import { profileImageUpload } from "../middlewares/profileUpload.js";

const router = Router();

router.use(requireSeller);
router.get("/", getProfile);
router.put("/selling-status", updateSellingStatus);
router.put("/", profileImageUpload, updateProfile);

export default router;
