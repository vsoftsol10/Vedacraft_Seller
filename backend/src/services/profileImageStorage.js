import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { productImagesBucket } from "./productImageStorage.js";

const extensionFor = (mimeType) => ({
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
})[mimeType];

const profilePrefix = (sellerId) => `seller-profiles/${String(sellerId).replace(/[^a-zA-Z0-9_-]/g, "")}/`;

export const uploadProfileImage = async (file, sellerId) => {
  const extension = extensionFor(file.mimetype);
  if (!extension) throw new Error("Only PNG and JPEG images are allowed.");

  const path = `${profilePrefix(sellerId)}${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(productImagesBucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(productImagesBucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
};

export const removeProfileImage = async (path, sellerId) => {
  // Never allow a profile replacement/removal to delete an object outside the
  // authenticated application's own prefix (including seller product images).
  if (!path || !path.startsWith(profilePrefix(sellerId))) return;
  const { error } = await supabase.storage.from(productImagesBucket).remove([path]);
  if (error) console.error("Unable to remove Supabase profile image:", error.message);
};

export const profileImagePathFromUrl = (url, sellerId) => {
  if (!url) return null;
  const { data } = supabase.storage.from(productImagesBucket).getPublicUrl("");
  const prefix = data.publicUrl.endsWith("/") ? data.publicUrl : `${data.publicUrl}/`;
  if (!url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length));
  return path.startsWith(profilePrefix(sellerId)) ? path : null;
};
