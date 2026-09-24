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
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductCategories,
  getProducts,
  getProductStats,
  updateProduct,
  updateProductStatus,
  bulkPreviewProducts,
  bulkConfirmProducts,
  downloadBulkTemplate,
} from "../controllers/productController.js";
import { productImageUpload, bulkProductUpload } from "../middlewares/upload.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);

router.get("/stats", getProductStats);
router.get("/categories", getProductCategories);
router.get("/bulk-template", downloadBulkTemplate);
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
