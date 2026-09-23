import { Router } from "express";
import { getBankDetails, updateBankDetails } from "../controllers/bankDetailsController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();

router.use(requireSeller);
router.get("/", getBankDetails);
router.put("/", updateBankDetails);

export default router;
