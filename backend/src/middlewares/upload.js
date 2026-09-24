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

export const bulkProductUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, done) => {
    if (file.fieldname === "sheet") {
      const allowedSheetTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel",
        "text/csv",
      ];
      const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
      const allowedExtensions = new Set([".csv", ".xlsx", ".xls"]);
      const accepted = allowedSheetTypes.includes(file.mimetype)
        || (file.mimetype === "application/octet-stream" && allowedExtensions.has(extension));
      return done(null, accepted);
    }
    return done(null, ["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype));
  },
  limits: { fileSize: 2 * 1024 * 1024 },
}).fields([
  { name: "sheet", maxCount: 1 },
  { name: "images", maxCount: 200 },
]);
