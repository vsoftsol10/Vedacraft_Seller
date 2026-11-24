// Tests for bank details validation logic (extracted from bankDetailsController.js)

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ─── Helpers mirrored from bankDetailsController ───────────────────────────────
const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

const ACCOUNT_TYPES = new Map([["savings", "Savings"], ["current", "Current"]]);

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

// Valid base fixture
const VALID = {
  accountHolderName: "Kavitha Rajan",
  accountNumber: "123456789012",
  confirmAccountNumber: "123456789012",
  ifscCode: "SBIN0001234",
  bankName: "State Bank of India",
  branchName: "Chennai Branch",
  accountType: "savings",
};

// ─── 1. Account Holder Name ────────────────────────────────────────────────────
describe("validate — accountHolderName", () => {
  test("accepts valid name", () => {
    const { errors } = validate(VALID);
    assert.equal(errors.accountHolderName, undefined);
  });
  test("rejects single character name", () => {
    const { errors } = validate({ ...VALID, accountHolderName: "A" });
    assert.ok(errors.accountHolderName);
  });
  test("rejects empty name", () => {
    const { errors } = validate({ ...VALID, accountHolderName: "" });
    assert.ok(errors.accountHolderName);
  });
  test("rejects name over 100 characters", () => {
    const { errors } = validate({ ...VALID, accountHolderName: "A".repeat(101) });
    assert.ok(errors.accountHolderName);
  });
});

// ─── 2. Account Number ────────────────────────────────────────────────────────
describe("validate — accountNumber", () => {
  test("accepts valid 12-digit account number", () => {
    const { errors } = validate(VALID);
    assert.equal(errors.accountNumber, undefined);
  });
  test("accepts minimum 9-digit account number", () => {
    const { errors } = validate({ ...VALID, accountNumber: "123456789", confirmAccountNumber: "123456789" });
    assert.equal(errors.accountNumber, undefined);
  });
  test("accepts maximum 18-digit account number", () => {
    const { errors } = validate({ ...VALID, accountNumber: "123456789012345678", confirmAccountNumber: "123456789012345678" });
    assert.equal(errors.accountNumber, undefined);
  });
  test("rejects 8-digit account number (too short)", () => {
    const { errors } = validate({ ...VALID, accountNumber: "12345678", confirmAccountNumber: "12345678" });
    assert.ok(errors.accountNumber);
  });
  test("rejects account number with letters", () => {
    const { errors } = validate({ ...VALID, accountNumber: "12345ABCDE", confirmAccountNumber: "12345ABCDE" });
    assert.ok(errors.accountNumber);
  });
  test("rejects mismatched confirm account number", () => {
    const { errors } = validate({ ...VALID, confirmAccountNumber: "999999999" });
    assert.ok(errors.confirmAccountNumber);
  });
  test("rejects empty confirm account number", () => {
    const { errors } = validate({ ...VALID, confirmAccountNumber: "" });
    assert.ok(errors.confirmAccountNumber);
  });
});

// ─── 3. IFSC Code ─────────────────────────────────────────────────────────────
describe("validate — ifscCode", () => {
  test("accepts valid IFSC SBIN0001234", () => {
    const { errors } = validate(VALID);
    assert.equal(errors.ifscCode, undefined);
  });
  test("accepts lowercase IFSC (auto-uppercased)", () => {
    const { errors } = validate({ ...VALID, ifscCode: "sbin0001234" });
    assert.equal(errors.ifscCode, undefined);
  });
  test("rejects IFSC without zero in position 5", () => {
    const { errors } = validate({ ...VALID, ifscCode: "SBIN1001234" });
    assert.ok(errors.ifscCode);
  });
  test("rejects too-short IFSC", () => {
    const { errors } = validate({ ...VALID, ifscCode: "SBIN001" });
    assert.ok(errors.ifscCode);
  });
  test("rejects empty IFSC", () => {
    const { errors } = validate({ ...VALID, ifscCode: "" });
    assert.ok(errors.ifscCode);
  });
});

// ─── 4. Account Type ──────────────────────────────────────────────────────────
describe("validate — accountType", () => {
  test("accepts savings", () => {
    const { errors, values } = validate(VALID);
    assert.equal(errors.accountType, undefined);
    assert.equal(values.accountType, "Savings");
  });
  test("accepts Current (case-insensitive)", () => {
    const { errors, values } = validate({ ...VALID, accountType: "CURRENT" });
    assert.equal(errors.accountType, undefined);
    assert.equal(values.accountType, "Current");
  });
  test("rejects invalid account type", () => {
    const { errors } = validate({ ...VALID, accountType: "Joint" });
    assert.ok(errors.accountType);
  });
  test("rejects empty account type", () => {
    const { errors } = validate({ ...VALID, accountType: "" });
    assert.ok(errors.accountType);
  });
});

// ─── 5. Full valid payload ────────────────────────────────────────────────────
describe("validate — full valid payload", () => {
  test("returns no errors for a fully valid payload", () => {
    const { errors } = validate(VALID);
    assert.deepEqual(errors, {});
  });
  test("returned values are cleaned and normalized", () => {
    const { values } = validate({ ...VALID, ifscCode: "sbin0001234", accountType: "SAVINGS" });
    assert.equal(values.ifscCode, "SBIN0001234");
    assert.equal(values.accountType, "Savings");
  });
});
