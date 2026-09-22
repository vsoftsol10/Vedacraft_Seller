import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, done) => {
    if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) return done(null, true);
    const error = new Error("Only PNG and JPEG images are allowed.");
    error.code = "PROFILE_INVALID_IMAGE";
    return done(error);
  },
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

export const profileImageUpload = (req, res, next) => {
  upload.single("profileImage")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: { profileImage: "Image must be 2 MB or smaller." } });
    }
    if (error.code === "PROFILE_INVALID_IMAGE" || error instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: { profileImage: "Only PNG and JPEG images are allowed." } });
    }
    return next(error);
  });
};
