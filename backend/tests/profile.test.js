// VED-14: Automated Tests - Profile Module
// Tests phone number normalisation, email validation, and profile field logic.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ─── Helper functions extracted from profileController.js ─────────────────────
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normaliseIndianMobile = (value) => {
  let number = String(value ?? "").trim().replace(/[\s-]/g, "");
  if (number.startsWith("+91")) number = number.slice(3);
  else if (/^91[6-9]\d{9}$/.test(number)) number = number.slice(2);
  return /^[6-9]\d{9}$/.test(number) ? number : null;
};

const validateProfileFields = ({ email, mobileNumber, alternateNumber }) => {
  const errors = {};
  const mobile = normaliseIndianMobile(mobileNumber);
  const alternate = alternateNumber ? normaliseIndianMobile(alternateNumber) : "";

  if (!emailPattern.test(String(email ?? "").trim().toLowerCase())) {
    errors.email = "Enter a valid email address.";
  }
  if (!mobile) {
    errors.mobileNumber = "Enter a valid 10-digit Indian mobile number.";
  }
  if (alternateNumber && !alternate) {
    errors.alternateNumber = "Enter a valid 10-digit Indian mobile number.";
  }
  if (mobile && alternate && mobile === alternate) {
    errors.alternateNumber = "Alternate number must be different from your mobile number.";
  }
  return errors;
};

// ─── 1. normaliseIndianMobile ─────────────────────────────────────────────────
describe("normaliseIndianMobile", () => {
  test("accepts plain 10-digit mobile starting with 9", () => {
    assert.equal(normaliseIndianMobile("9876543210"), "9876543210");
  });
  test("accepts number starting with +91 prefix", () => {
    assert.equal(normaliseIndianMobile("+919876543210"), "9876543210");
  });
  test("accepts number starting with 91 prefix", () => {
    assert.equal(normaliseIndianMobile("919876543210"), "9876543210");
  });
  test("strips spaces and dashes", () => {
    assert.equal(normaliseIndianMobile("98765 43210"), "9876543210");
  });
  test("strips dashes", () => {
    assert.equal(normaliseIndianMobile("98765-43210"), "9876543210");
  });
  test("accepts number starting with 6 (valid Indian range)", () => {
    assert.equal(normaliseIndianMobile("6789012345"), "6789012345");
  });
  test("accepts number starting with 7", () => {
    assert.equal(normaliseIndianMobile("7812345678"), "7812345678");
  });
  test("accepts number starting with 8", () => {
    assert.equal(normaliseIndianMobile("8900012345"), "8900012345");
  });
  test("rejects number starting with 5 (invalid Indian range)", () => {
    assert.equal(normaliseIndianMobile("5876543210"), null);
  });
  test("rejects number starting with 1", () => {
    assert.equal(normaliseIndianMobile("1234567890"), null);
  });
  test("rejects 9-digit number (too short)", () => {
    assert.equal(normaliseIndianMobile("987654321"), null);
  });
  test("rejects 11-digit number (too long, no country code)", () => {
    assert.equal(normaliseIndianMobile("98765432101"), null);
  });
  test("rejects alphabetic input", () => {
    assert.equal(normaliseIndianMobile("abcdefghij"), null);
  });
  test("rejects empty string", () => {
    assert.equal(normaliseIndianMobile(""), null);
  });
  test("rejects null", () => {
    assert.equal(normaliseIndianMobile(null), null);
  });
});

// ─── 2. Email validation ───────────────────────────────────────────────────────
describe("emailPattern validation", () => {
  test("accepts valid email", () => {
    assert.ok(emailPattern.test("kathirvel@vedacrafts.in"));
  });
  test("accepts gmail address", () => {
    assert.ok(emailPattern.test("seller@gmail.com"));
  });
  test("rejects email without @", () => {
    assert.ok(!emailPattern.test("kathirvelvedacrafts.in"));
  });
  test("rejects email without domain", () => {
    assert.ok(!emailPattern.test("kathirvel@"));
  });
  test("rejects email without extension", () => {
    assert.ok(!emailPattern.test("kathirvel@vedacrafts"));
  });
  test("rejects plain text", () => {
    assert.ok(!emailPattern.test("notanemail"));
  });
  test("rejects empty string", () => {
    assert.ok(!emailPattern.test(""));
  });
  test("rejects email with spaces", () => {
    assert.ok(!emailPattern.test("kath irvel@vedacrafts.in"));
  });
});

// ─── 3. Full profile validation ────────────────────────────────────────────────
describe("validateProfileFields", () => {
  test("valid profile data has no errors", () => {
    const errors = validateProfileFields({
      email: "kathir@vedacrafts.in",
      mobileNumber: "9876543210",
      alternateNumber: "",
    });
    assert.deepEqual(errors, {});
  });

  test("invalid email adds email error", () => {
    const errors = validateProfileFields({
      email: "not-an-email",
      mobileNumber: "9876543210",
      alternateNumber: "",
    });
    assert.ok("email" in errors);
  });

  test("invalid mobile adds mobileNumber error", () => {
    const errors = validateProfileFields({
      email: "kathir@vedacrafts.in",
      mobileNumber: "1234567890",
      alternateNumber: "",
    });
    assert.ok("mobileNumber" in errors);
  });

  test("mobile same as alternate adds alternateNumber error", () => {
    const errors = validateProfileFields({
      email: "kathir@vedacrafts.in",
      mobileNumber: "9876543210",
      alternateNumber: "9876543210",
    });
    assert.ok("alternateNumber" in errors);
    assert.match(errors.alternateNumber, /different/);
  });

  test("invalid alternate number while mobile is valid", () => {
    const errors = validateProfileFields({
      email: "kathir@vedacrafts.in",
      mobileNumber: "9876543210",
      alternateNumber: "1234567890",
    });
    assert.ok("alternateNumber" in errors);
  });

  test("valid alternate number different from mobile has no error", () => {
    const errors = validateProfileFields({
      email: "kathir@vedacrafts.in",
      mobileNumber: "9876543210",
      alternateNumber: "8765432109",
    });
    assert.deepEqual(errors, {});
  });

  test("multiple invalid fields returns multiple errors", () => {
    const errors = validateProfileFields({
      email: "bademail",
      mobileNumber: "1234",
      alternateNumber: "",
    });
    assert.ok("email" in errors);
    assert.ok("mobileNumber" in errors);
  });
});
