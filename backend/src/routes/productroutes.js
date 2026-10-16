// import { Router } from "express";
// import { createProduct, deleteProduct, getProductById, getProductCategories, getProducts, getProductStats, updateProduct,updateProductStatus } from "../controllers/productController.js";
// import { productImageUpload } from "../middlewares/upload.js";
// import { requireSeller } from "../middlewares/sellerAuth.js";

// const router = Router();
// router.use(requireSeller);

// router.get("/stats", getProductStats);
// router.get("/categories", getProductCategories);
// router.get("/", getProducts);
// router.get("/:id", getProductById);
// router.post("/", productImageUpload, createProduct);
// router.put("/:id", productImageUpload, updateProduct);
// router.delete("/:id", deleteProduct);
// router.patch("/:id/status", updateProductStatus);
// export default router;

import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getPublicProductById,
  getProductTranslations,
  getProductCategories,
  getNextProductSku,
  getProducts,
  getProductStats,
  updateProduct,
  updateProductStatus,
  saveProductTranslation,
  retryProductTranslations,
  translateMissingProducts,
  bulkAddStock,
  bulkPreviewProducts,
  bulkConfirmProducts,
  downloadBulkTemplate,
} from "../controllers/productController.js";
import { productImageUpload, bulkProductUpload } from "../middlewares/upload.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
const translationActionLimit = rateLimit({ windowMs: 60_000, limit: 10, keyGenerator: (req) => req.seller?.id || req.ip, standardHeaders: "draft-7", legacyHeaders: false, message: { success: false, message: "Too many translation requests. Try again shortly." } });
router.get("/public/:id", getPublicProductById);
router.all(["/translations/export", "/translations/import"], (_req, res) => res.status(404).json({ success: false, message: "Not found" }));
router.use(requireSeller);

router.get("/stats", getProductStats);
router.get("/categories", getProductCategories);
router.get("/next-sku", getNextProductSku);
router.get("/bulk-template", downloadBulkTemplate);
router.patch("/bulk-stock", bulkAddStock);
router.post("/translations/translate-missing", translationActionLimit, translateMissingProducts);
router.get("/:id/translations", getProductTranslations);
router.put("/:id/translations/:language", saveProductTranslation);
router.post("/:id/translations/retry", translationActionLimit, retryProductTranslations);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", productImageUpload, createProduct);
router.put("/:id", productImageUpload, updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/status", updateProductStatus);

// Bulk import — Step 1: parse sheet and match images, return review table
router.post("/bulk-preview", bulkProductUpload, bulkPreviewProducts);
// Bulk import — Step 2: upload matched images and insert approved rows
router.post("/bulk-confirm", bulkProductUpload, bulkConfirmProducts);

export default router;
