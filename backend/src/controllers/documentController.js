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

const documentTypeFor = (value) => {
  const input = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (documentTypes[input]) return input;
  return Object.entries(documentTypes).find(([, label]) => label.toLowerCase() === String(value ?? "").trim().toLowerCase())?.[0] ?? null;
};

const extensionFor = (file) => ({ "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg" }[file.mimetype]);

export const getSellerDocuments = async (req, res, next) => {
  try {
    const entries = await Promise.all(Object.entries(documentTypes).map(async ([folder, type]) => {
      const { data, error } = await supabase.storage.from(bucket).list(`${req.seller.id}/${folder}`, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const file = data?.[0];
      if (!file) return { key: folder, type, uploaded: false };
      const path = `${req.seller.id}/${folder}/${file.name}`;
      const { data: signed, error: signError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
      if (signError) throw signError;
      return { key: folder, type, uploaded: true, name: file.name, url: signed.signedUrl, updatedAt: file.updated_at || file.created_at, mimeType: file.metadata?.mimetype };
    }));
    return res.json({ success: true, data: entries });
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

    const { data: previous, error: previousError } = await supabase.from("seller_documents")
      .select("storage_path").eq("seller_application_id", req.seller.id).eq("document_type", documentType).maybeSingle();
    if (previousError) throw previousError;

    uploadedPath = `${req.seller.id}/${documentType}/${randomUUID()}.${extensionFor(req.file)}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadedPath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw uploadError;

    const payload = { seller_application_id: req.seller.id, user_id: seller.user_id, document_type: documentType, storage_path: uploadedPath, original_filename: req.file.originalname, mime_type: req.file.mimetype, size_bytes: req.file.size };
    const { data, error: saveError } = await supabase.from("seller_documents").upsert(payload, { onConflict: "seller_application_id,document_type" }).select().single();
    if (saveError) throw saveError;
    if (previous?.storage_path && previous.storage_path !== uploadedPath) await supabase.storage.from(bucket).remove([previous.storage_path]);
    const { data: signed, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(uploadedPath, 60 * 60);
    if (signedError) throw signedError;
    return res.status(201).json({ success: true, data: { id: data.id, key: documentType, type: documentTypes[documentType], uploaded: true, name: data.original_filename, url: signed.signedUrl, updatedAt: data.created_at, mimeType: data.mime_type } });
  } catch (error) {
    if (uploadedPath) await supabase.storage.from(bucket).remove([uploadedPath]);
    return next(error);
  }
};
