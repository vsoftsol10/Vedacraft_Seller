import { Router } from "express";
import { deleteSellingLocationState, getSellingLocations, replaceSellingLocationState } from "../controllers/sellingLocationController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();

router.use(requireSeller);
router.get("/", getSellingLocations);
router.put("/:state", replaceSellingLocationState);
router.delete("/:state", deleteSellingLocationState);

export default router;
