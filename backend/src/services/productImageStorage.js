import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";

export const productImagesBucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

const extensionFor = (mimeType) => ({
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
})[mimeType];

const filePath = (productId, file) => {
  const extension = extensionFor(file.mimetype);
  if (!extension) throw new Error("Only PNG and JPEG product images are supported");
  return `seller-products/${productId.replace(/[^a-zA-Z0-9_-]/g, "")}/${randomUUID()}.${extension}`;
};

export const uploadProductImages = async (files, productId) => {
  const uploads = [
    ...(files?.coverImage?.[0] ? [{ kind: "cover", file: files.coverImage[0] }] : []),
    ...(files?.additionalImages ?? []).map((file) => ({ kind: "additional", file })),
  ];
  const stored = [];

  try {
    for (const { kind, file } of uploads) {
      const path = filePath(productId, file);
      const { error } = await supabase.storage.from(productImagesBucket).upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(productImagesBucket).getPublicUrl(path);
      stored.push({ kind, path, url: data.publicUrl });
    }
  } catch (error) {
    await removeProductImages(stored.map(({ path }) => path));
    throw error;
  }

  return {
    cover: stored.find(({ kind }) => kind === "cover")?.url,
    additional: stored.filter(({ kind }) => kind === "additional").map(({ url }) => url),
    paths: stored.map(({ path }) => path),
  };
};

export const removeProductImages = async (paths) => {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(productImagesBucket).remove(paths);
  if (error) console.error("Unable to remove Supabase product images:", error.message);
};

export const storagePathFromUrl = (url) => {
  if (!url) return null;
  const { data } = supabase.storage.from(productImagesBucket).getPublicUrl("");
  const prefix = data.publicUrl.endsWith("/") ? data.publicUrl : `${data.publicUrl}/`;
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
};
