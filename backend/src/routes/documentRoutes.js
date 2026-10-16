import { Router } from "express";
import multer from "multer";
import { getSellerDocuments, replaceSellerDocument, uploadSellerDocument } from "../controllers/documentController.js";
import { requireSeller } from "../middlewares/sellerAuth.js";

const router = Router();
router.use(requireSeller);
router.get("/", getSellerDocuments);
const documentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, done) => done(null, ["application/pdf", "image/png", "image/jpeg"].includes(file.mimetype)) });
router.post("/", documentUpload.single("document"), uploadSellerDocument);
router.put("/:id", documentUpload.single("document"), replaceSellerDocument);
export default router;
