import { Router } from "express";
import { createOffer, deleteOffer, getOffers, toggleOffer, updateOffer } from "../controllers/offerController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();

router.use(requireSeller);
router.get("/", getOffers);
router.post("/", createOffer);
router.put("/:id", updateOffer);
router.patch("/:id/toggle", toggleOffer);
router.delete("/:id", deleteOffer);

export default router;
