import multer from "multer";

const upload = multer({
  // Keep files in memory only; the controller sends them straight to Supabase
  // Storage and no product image is written to this server's filesystem.
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, done) => done(null, ["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const productImageUpload = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "additionalImages", maxCount: 4 },
]);
