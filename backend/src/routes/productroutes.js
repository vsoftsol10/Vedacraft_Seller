import { Router } from "express";
import { createProduct, deleteProduct, getProductById, getProductCategories, getProducts, getProductStats, updateProduct } from "../controllers/productController.js";
import { productImageUpload } from "../middlewares/upload.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);

router.get("/stats", getProductStats);
router.get("/categories", getProductCategories);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", productImageUpload, createProduct);
router.put("/:id", productImageUpload, updateProduct);
router.delete("/:id", deleteProduct);

export default router;
