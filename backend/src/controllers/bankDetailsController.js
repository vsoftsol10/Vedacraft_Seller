import { supabase } from "../config/supabase.js";
import { encryptBankAccountNumber } from "../services/bankCrypto.js";

const table = "seller_applications";
const REQUIRE_APPROVED = false;
const APPROVED_STATUSES = ["approved"];
const ACCOUNT_TYPES = new Map([["savings", "Savings"], ["current", "Current"]]);
const fields = "id, status, account_holder_name, account_number_encrypted, account_number_last4, ifsc_code, bank_name, branch_name, account_type";

const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

const toBankDetails = (seller) => {
  const last4 = seller.account_number_last4 || "";
  return {
    accountHolderName: seller.account_holder_name || "",
    ifscCode: seller.ifsc_code || "",
    bankName: seller.bank_name || "",
    branchName: seller.branch_name || "",
    accountType: seller.account_type || "",
    accountNumberLast4: last4,
    hasBankDetails: Boolean(seller.account_number_encrypted || last4),
  };
};

const findSeller = async (sellerId) => {
  const { data, error } = await supabase.from(table).select(fields).eq("id", sellerId).maybeSingle();
  if (error) throw error;
  return data;
};

const passwordConfirmationError = (res) => res.status(401).json({
  success: false,
  message: "Please confirm your password to update bank details.",
});

const confirmCurrentPassword = async (seller, currentPassword) => {
  if (typeof currentPassword !== "string" || !currentPassword || !process.env.SELLER_PASSWORD_ENCRYPTION_KEY) {
    return false;
  }

  const { data, error } = await supabase.rpc("authenticate_seller", {
    p_seller_code: seller.sellerCode,
    p_password: currentPassword,
    p_encryption_key: process.env.SELLER_PASSWORD_ENCRYPTION_KEY,
  });
  if (error) throw error;

  return data?.[0]?.application_id === seller.id;
};

const validate = (body) => {
  const errors = {};
  const accountHolderName = clean(body.accountHolderName);
  const suppliedAccountNumber = typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";
  const suppliedConfirmAccountNumber = typeof body.confirmAccountNumber === "string" ? body.confirmAccountNumber.trim() : "";
  const accountNumber = /^\d*$/.test(suppliedAccountNumber) ? suppliedAccountNumber : "";
  const confirmAccountNumber = /^\d*$/.test(suppliedConfirmAccountNumber) ? suppliedConfirmAccountNumber : "";
  const ifscCode = String(body.ifscCode ?? "").trim().toUpperCase();
  const bankName = clean(body.bankName);
  const branchName = clean(body.branchName);
  const accountType = ACCOUNT_TYPES.get(clean(body.accountType).toLowerCase());

  if (accountHolderName.length < 2 || accountHolderName.length > 100) errors.accountHolderName = "Account holder name must be 2-100 characters.";
  if (!/^\d{9,18}$/.test(accountNumber)) errors.accountNumber = "Enter a valid account number (9-18 digits).";
  if (!confirmAccountNumber) errors.confirmAccountNumber = "Re-enter your account number.";
  else if (confirmAccountNumber !== accountNumber) errors.confirmAccountNumber = "Account numbers do not match.";
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) errors.ifscCode = "Enter a valid 11-character IFSC code.";
  if (bankName.length < 2 || bankName.length > 100) errors.bankName = "Bank name must be 2-100 characters.";
  if (branchName.length < 2 || branchName.length > 100) errors.branchName = "Branch name must be 2-100 characters.";
  if (!accountType) errors.accountType = "Select Savings or Current.";

  return { errors, values: { accountHolderName, accountNumber, ifscCode, bankName, branchName, accountType } };
};

export const getBankDetails = async (req, res) => {
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });
    return res.json({ success: true, data: toBankDetails(seller) });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Unable to load bank details. Please try again." });
  }
};

export const updateBankDetails = async (req, res) => {
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });
    if (REQUIRE_APPROVED && !APPROVED_STATUSES.includes(seller.status)) {
      return res.status(403).json({ success: false, message: "Your account must be approved before you can edit bank details." });
    }

    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    if (!await confirmCurrentPassword(req.seller, body.currentPassword)) return passwordConfirmationError(res);

    const { errors, values } = validate(body);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors });

    const payload = {
      account_holder_name: values.accountHolderName,
      account_number_encrypted: encryptBankAccountNumber(values.accountNumber),
      account_number_last4: values.accountNumber.slice(-4),
      ifsc_code: values.ifscCode,
      bank_name: values.bankName,
      branch_name: values.branchName,
      account_type: values.accountType,
      updated_at: new Date().toISOString(),
    };
    const { data: updated, error } = await supabase.from(table).update(payload).eq("id", seller.id).select(fields).single();
    if (error) throw error;

    console.info(`[${new Date().toISOString()}] Bank details changed for seller application ${seller.id}.`);
    return res.json({ success: true, message: "Bank details updated successfully.", data: toBankDetails(updated) });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Unable to save bank details. Please try again." });
  }
};
