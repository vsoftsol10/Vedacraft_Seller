import { supabase } from "../config/supabase.js";

const table = "seller_applications";
const REQUIRE_APPROVED = false;
const APPROVED_STATUSES = ["approved"];
const EDITABLE_TAX_IDS = false;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const profileFields = "id, status, business_name, store_name, store_type, store_description, pan_number, gst_number";

const toBusiness = (seller) => ({
  businessName: seller.business_name || "",
  storeName: seller.store_name || "",
  storeType: seller.store_type || "",
  storeDescription: seller.store_description || "",
  panNumber: seller.pan_number || "",
  gstNumber: seller.gst_number || "",
});

const normaliseText = (value) => String(value).trim().replace(/\s+/g, " ");

const findSeller = async (sellerId) => {
  const { data, error } = await supabase
    .from(table)
    .select(profileFields)
    .eq("id", sellerId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const addTextField = (body, field, column, min, max, errors, payload, { allowEmpty = false } = {}) => {
  if (!Object.hasOwn(body, field)) return;
  if (typeof body[field] !== "string") {
    errors[field] = "Enter a text value.";
    return;
  }
  const value = normaliseText(body[field]);
  if ((value.length === 0 && !allowEmpty) || (value.length > 0 && (value.length < min || value.length > max))) {
    errors[field] = allowEmpty
      ? `Must be empty or between ${min} and ${max} characters.`
      : `Must be between ${min} and ${max} characters.`;
    return;
  }
  payload[column] = value;
};

const duplicateField = (error) => {
  const detail = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  if (detail.includes("store_name")) return "storeName";
  if (detail.includes("store_type")) return "storeType";
  if (detail.includes("pan_number")) return "panNumber";
  if (detail.includes("gst_number")) return "gstNumber";
  return "businessName";
};

const validateTaxIdsWhenEnabled = async (body, sellerId, errors, payload) => {
  if (!EDITABLE_TAX_IDS) return;

  const requested = [];
  for (const [field, column, pattern, label] of [
    ["panNumber", "pan_number", PAN_PATTERN, "PAN"],
    ["gstNumber", "gst_number", GSTIN_PATTERN, "GSTIN"],
  ]) {
    if (!Object.hasOwn(body, field)) continue;
    if (typeof body[field] !== "string") {
      errors[field] = `Enter a valid ${label}.`;
      continue;
    }
    const value = normaliseText(body[field]).toUpperCase();
    if (value && !pattern.test(value)) {
      errors[field] = `Enter a valid ${label}.`;
      continue;
    }
    payload[column] = value;
    if (value) requested.push({ field, column, value, label });
  }

  for (const item of requested) {
    const { data, error } = await supabase.from(table).select("id").eq(item.column, item.value).neq("id", sellerId).limit(1);
    if (error) throw error;
    if (data?.length) errors[item.field] = `This ${item.label} is already in use.`;
  }
};

export const getBusiness = async (req, res) => {
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });
    return res.json({ success: true, data: toBusiness(seller) });
  } catch (error) {
    console.error("Unable to get business information:", error);
    return res.status(500).json({ success: false, message: "Unable to load business information. Please try again." });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });
    if (REQUIRE_APPROVED && !APPROVED_STATUSES.includes(seller.status)) {
      return res.status(403).json({ success: false, message: "Your account must be approved before you can edit business information." });
    }

    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const errors = {};
    const payload = {};

    // Explicit allowlist: absent fields are preserved, including business_name.
    addTextField(body, "businessName", "business_name", 2, 150, errors, payload);
    addTextField(body, "storeName", "store_name", 2, 100, errors, payload);
    addTextField(body, "storeType", "store_type", 2, 100, errors, payload, { allowEmpty: true });
    addTextField(body, "storeDescription", "store_description", 0, 1000, errors, payload, { allowEmpty: true });
    await validateTaxIdsWhenEnabled(body, seller.id, errors, payload);

    if (Object.keys(errors).length) return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors });

    payload.updated_at = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", seller.id)
      .select(profileFields)
      .single();
    if (error) throw error;

    return res.json({ success: true, message: "Business information updated successfully.", data: toBusiness(updated) });
  } catch (error) {
    if (error?.code === "23505") {
      const field = duplicateField(error);
      return res.status(409).json({ success: false, message: "A conflicting business value already exists.", errors: { [field]: "A conflicting value already exists." } });
    }
    console.error("Unable to update business information:", error);
    return res.status(500).json({ success: false, message: "Unable to update business information. Please try again." });
  }
};
