import { supabase } from "../config/supabase.js";
import { profileImagePathFromUrl, removeProfileImage, uploadProfileImage } from "../services/profileImageStorage.js";

const table = "seller_applications";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toProfile = (seller) => ({
  fullName: seller.full_name || "",
  email: seller.business_email || "",
  mobileNumber: seller.mobile_number || "",
  alternateNumber: seller.alternate_number || "",
  profileImage: seller.profile_image || null,
  isSellingActive: seller.is_selling_active !== false,
});

const normaliseIndianMobile = (value) => {
  let number = String(value ?? "").trim().replace(/[\s-]/g, "");
  if (number.startsWith("+91")) number = number.slice(3);
  else if (/^91[6-9]\d{9}$/.test(number)) number = number.slice(2);
  return /^[6-9]\d{9}$/.test(number) ? number : null;
};

const imageTypeFromMagicBytes = (buffer) => {
  if (buffer?.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer?.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  return null;
};

const findSeller = async (sellerId) => {
  const { data, error } = await supabase.from(table).select("id, full_name, business_email, mobile_number, alternate_number, profile_image, is_selling_active, updated_at").eq("id", sellerId).maybeSingle();
  if (error) throw error;
  return data;
};

export const getProfile = async (req, res) => {
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });
    return res.json({ success: true, data: toProfile(seller) });
  } catch (error) {
    console.error("Unable to get seller profile:", error);
    return res.status(500).json({ success: false, message: "Unable to load profile. Please try again." });
  }
};

// Kept separate from the full profile form so store availability changes take
// effect immediately and never depend on unrelated profile fields being valid.
export const updateSellingStatus = async (req, res) => {
  try {
    if (typeof req.body?.isSellingActive !== "boolean") {
      return res.status(400).json({ success: false, message: "Selling status must be true or false." });
    }

    const { data, error } = await supabase
      .from(table)
      .update({ is_selling_active: req.body.isSellingActive, updated_at: new Date().toISOString() })
      .eq("id", req.seller.id)
      .select("is_selling_active")
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });

    return res.json({ success: true, data: { isSellingActive: data.is_selling_active } });
  } catch (error) {
    console.error("Unable to update seller selling status:", error);
    return res.status(500).json({ success: false, message: "Unable to update selling status. Please try again." });
  }
};

export const updateProfile = async (req, res) => {
  let uploadedImage;
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });

    const fullName = String(req.body?.fullName ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const mobileNumber = normaliseIndianMobile(req.body?.mobileNumber);
    const alternateRaw = String(req.body?.alternateNumber ?? "").trim();
    const alternateNumber = alternateRaw ? normaliseIndianMobile(alternateRaw) : "";
    const sellingStatus = req.body?.isSellingActive;
    const errors = {};

    if (fullName.length < 2 || fullName.length > 100) errors.fullName = "Full name must be between 2 and 100 characters.";
    if (!emailPattern.test(email)) errors.email = "Enter a valid email address.";
    if (!mobileNumber) errors.mobileNumber = "Enter a valid 10-digit Indian mobile number.";
    if (alternateRaw && !alternateNumber) errors.alternateNumber = "Enter a valid 10-digit Indian mobile number.";
    if (mobileNumber && alternateNumber && mobileNumber === alternateNumber) errors.alternateNumber = "Alternate number must be different from your mobile number.";
    if (sellingStatus !== undefined && sellingStatus !== "true" && sellingStatus !== "false") errors.isSellingActive = "Choose whether your store is accepting new orders.";
    if (req.file && !imageTypeFromMagicBytes(req.file.buffer)) errors.profileImage = "Only valid PNG and JPEG images are allowed.";
    if (Object.keys(errors).length) return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors });

    const { data: duplicate, error: duplicateError } = await supabase.from(table).select("id").ilike("business_email", email).neq("id", seller.id).limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicate?.length) return res.status(409).json({ success: false, message: "This email address is already in use.", errors: { email: "This email address is already in use." } });

    const payload = {
      full_name: fullName,
      business_email: email,
      mobile_number: mobileNumber,
      alternate_number: alternateNumber || null,
      // Multipart form fields arrive as strings. An omitted field preserves
      // compatibility with older clients instead of changing the status.
      ...(sellingStatus === undefined ? {} : { is_selling_active: sellingStatus === "true" }),
      updated_at: new Date().toISOString(),
    };
    const oldImagePath = profileImagePathFromUrl(seller.profile_image, seller.id);
    const removeImage = req.body?.removeProfileImage === "true";

    if (req.file) {
      const verifiedType = imageTypeFromMagicBytes(req.file.buffer);
      // Store the verified type, never a client-provided MIME type.
      req.file.mimetype = verifiedType;
      uploadedImage = await uploadProfileImage(req.file, seller.id);
      payload.profile_image = uploadedImage.url;
    } else if (removeImage) {
      payload.profile_image = null;
    }

    const { data: updated, error: updateError } = await supabase.from(table).update(payload).eq("id", seller.id).select("id, full_name, business_email, mobile_number, alternate_number, profile_image, is_selling_active").single();
    if (updateError) {
      if (uploadedImage) await removeProfileImage(uploadedImage.path, seller.id);
      throw updateError;
    }

    if ((req.file || removeImage) && oldImagePath) await removeProfileImage(oldImagePath, seller.id);
    return res.json({ success: true, message: "Profile updated successfully.", data: toProfile(updated) });
  } catch (error) {
    // A database unique constraint, if present outside this repository, is still
    // presented as the documented field-level duplicate-email response.
    if (error?.code === "23505") return res.status(409).json({ success: false, message: "This email address is already in use.", errors: { email: "This email address is already in use." } });
    console.error("Unable to update seller profile:", error);
    return res.status(500).json({ success: false, message: "Unable to update profile. Please try again." });
  }
};
