import { Router } from "express";
import { createOffer, deleteOffer, extendOffer, getOffers, reuseOffer, toggleOffer, updateOffer } from "../controllers/offerController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();

router.use(requireSeller);
router.get("/", getOffers);
router.post("/", createOffer);
router.post("/:id/reuse", reuseOffer);
router.patch("/:id/extend", extendOffer);
router.put("/:id", updateOffer);
router.patch("/:id/toggle", toggleOffer);
router.delete("/:id", deleteOffer);

export default router;
