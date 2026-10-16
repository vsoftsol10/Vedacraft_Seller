import { supabase } from "../config/supabase.js";
import { randomUUID } from "crypto";

const bucket = "seller-verification-documents";
const documentTypes = {
  pan_card: "PAN Card",
  gst_certificate: "GST Certificate",
  bank_account_proof: "Bank Account Proof",
  business_registration: "Business Registration",
  supporting_document: "Supporting Document",
};
const protectedStatuses = ["pending", "approved"];

const documentTypeFor = (value) => {
  const input = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (documentTypes[input]) return input;
  return Object.entries(documentTypes).find(([, label]) => label.toLowerCase() === String(value ?? "").trim().toLowerCase())?.[0] ?? null;
};
const extensionFor = (file) => ({ "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg" }[file.mimetype]);
const toApiDocument = async (document) => {
  const { data: signed, error } = await supabase.storage.from(bucket).createSignedUrl(document.storage_path, 60 * 60);
  if (error) throw error;
  return { id: document.id, key: document.document_type, type: documentTypes[document.document_type], uploaded: true, status: document.status, name: document.original_filename, url: signed.signedUrl, updatedAt: document.updated_at || document.created_at, mimeType: document.mime_type };
};

export const getSellerDocuments = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("seller_documents").select("*").eq("seller_application_id", req.seller.id).order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ success: true, data: await Promise.all((data ?? []).map(toApiDocument)) });
  } catch (error) { return next(error); }
};

export const uploadSellerDocument = async (req, res, next) => {
  let uploadedPath;
  try {
    const documentType = documentTypeFor(req.body?.documentType);
    if (!documentType) return res.status(400).json({ success: false, message: "Select a valid document type." });
    if (!req.file || !extensionFor(req.file)) return res.status(400).json({ success: false, message: "Upload a PDF, PNG, or JPG document." });
    const { data: seller, error: sellerError } = await supabase.from("seller_applications").select("user_id").eq("id", req.seller.id).maybeSingle();
    if (sellerError) throw sellerError;
    if (!seller?.user_id) return res.status(404).json({ success: false, message: "Seller account was not found." });
    if (documentType !== "supporting_document") {
      const { data: existing, error } = await supabase.from("seller_documents").select("id").eq("seller_application_id", req.seller.id).eq("document_type", documentType).in("status", protectedStatuses).limit(1);
      if (error) throw error;
      if (existing?.length) return res.status(409).json({ success: false, message: "This document type is already uploaded." });
    }
    uploadedPath = `${req.seller.id}/${documentType}/${randomUUID()}.${extensionFor(req.file)}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadedPath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw uploadError;
    const payload = { seller_application_id: req.seller.id, user_id: seller.user_id, document_type: documentType, status: "pending", storage_path: uploadedPath, original_filename: req.file.originalname, mime_type: req.file.mimetype, size_bytes: req.file.size };
    const { data, error: saveError } = await supabase.from("seller_documents").insert(payload).select().single();
    if (saveError) {
      if (saveError.code === "23505") {
        await supabase.storage.from(bucket).remove([uploadedPath]);
        uploadedPath = null;
        return res.status(409).json({ success: false, message: "This document type is already uploaded." });
      }
      throw saveError;
    }
    return res.status(201).json({ success: true, data: await toApiDocument(data) });
  } catch (error) {
    if (uploadedPath) await supabase.storage.from(bucket).remove([uploadedPath]);
    return next(error);
  }
};

export const replaceSellerDocument = async (req, res, next) => {
  let uploadedPath;
  try {
    if (!req.file || !extensionFor(req.file)) return res.status(400).json({ success: false, message: "Upload a PDF, PNG, or JPG document." });
    const { data: existing, error: findError } = await supabase.from("seller_documents").select("*").eq("id", req.params.id).eq("seller_application_id", req.seller.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: "Document not found" });
    uploadedPath = `${req.seller.id}/${existing.document_type}/${randomUUID()}.${extensionFor(req.file)}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadedPath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw uploadError;
    const { data, error: updateError } = await supabase.from("seller_documents").update({ storage_path: uploadedPath, original_filename: req.file.originalname, mime_type: req.file.mimetype, size_bytes: req.file.size, status: "pending" }).eq("id", existing.id).eq("seller_application_id", req.seller.id).select().single();
    if (updateError) throw updateError;
    if (existing.storage_path !== uploadedPath) await supabase.storage.from(bucket).remove([existing.storage_path]);
    return res.json({ success: true, data: await toApiDocument(data) });
  } catch (error) {
    if (uploadedPath) await supabase.storage.from(bucket).remove([uploadedPath]);
    return next(error);
  }
};
