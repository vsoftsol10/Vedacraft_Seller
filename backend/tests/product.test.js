// VED-14: Automated Tests - Products Module
// Tests product validation logic without needing a real DB connection.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ─── Helper functions extracted from productController.js ─────────────────────
const LANGUAGES = new Set(["en", "ta", "hi", "te", "ml"]);
const nullableText = (value) => (value?.trim?.() ? value.trim() : null);
const nullableNumber = (value) => (value === "" || value === undefined ? null : Number(value));
const hasText = (value) =>
  typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
const languageFrom = (value) => (LANGUAGES.has(value) ? value : "en");
const stockStatusFor = (quantity, threshold) => {
  if (quantity <= 0) return "Out of Stock";
  return quantity <= threshold ? "Low Stock" : "In Stock";
};

// ─── 1. nullableText ───────────────────────────────────────────────────────────
describe("nullableText", () => {
  test("returns trimmed text for a normal string", () => {
    assert.equal(nullableText("  Pure Brass Pooja Diya  "), "Pure Brass Pooja Diya");
  });
  test("returns null for an empty string", () => {
    assert.equal(nullableText(""), null);
  });
  test("returns null for whitespace-only string", () => {
    assert.equal(nullableText("   "), null);
  });
  test("returns null for undefined", () => {
    assert.equal(nullableText(undefined), null);
  });
  test("returns null for null", () => {
    assert.equal(nullableText(null), null);
  });
});

// ─── 2. nullableNumber ────────────────────────────────────────────────────────
describe("nullableNumber", () => {
  test("converts string number to Number type", () => {
    assert.equal(nullableNumber("499"), 499);
  });
  test("returns null for empty string (optional price field)", () => {
    assert.equal(nullableNumber(""), null);
  });
  test("returns null for undefined", () => {
    assert.equal(nullableNumber(undefined), null);
  });
  test("converts decimal string correctly", () => {
    assert.equal(nullableNumber("99.50"), 99.5);
  });
  test("passes through numeric zero", () => {
    assert.equal(nullableNumber("0"), 0);
  });
});

// ─── 3. stockStatusFor ────────────────────────────────────────────────────────
describe("stockStatusFor", () => {
  test("returns Out of Stock when quantity is 0", () => {
    assert.equal(stockStatusFor(0, 5), "Out of Stock");
  });
  test("returns Out of Stock when quantity is negative", () => {
    assert.equal(stockStatusFor(-10, 5), "Out of Stock");
  });
  test("returns Low Stock when quantity equals low-stock threshold", () => {
    assert.equal(stockStatusFor(5, 5), "Low Stock");
  });
  test("returns Low Stock when quantity is below threshold", () => {
    assert.equal(stockStatusFor(2, 5), "Low Stock");
  });
  test("returns In Stock when quantity is above threshold", () => {
    assert.equal(stockStatusFor(50, 5), "In Stock");
  });
});

// ─── 4. hasText ───────────────────────────────────────────────────────────────
describe("hasText", () => {
  test("returns true for a valid string", () => {
    assert.equal(hasText("Handmade neem soap"), true);
  });
  test("returns false for empty string", () => {
    assert.equal(hasText(""), false);
  });
  test("returns false for whitespace-only string", () => {
    assert.equal(hasText("   "), false);
  });
  test("returns false for null", () => {
    assert.equal(hasText(null), false);
  });
  test("returns false for undefined", () => {
    assert.equal(hasText(undefined), false);
  });
  test("returns true for a number (non-null primitive)", () => {
    assert.equal(hasText(0), true);
  });
});

// ─── 5. languageFrom ─────────────────────────────────────────────────────────
describe("languageFrom - 5-language support (VED-12)", () => {
  test("accepts English (en)", () => {
    assert.equal(languageFrom("en"), "en");
  });
  test("accepts Tamil (ta)", () => {
    assert.equal(languageFrom("ta"), "ta");
  });
  test("accepts Hindi (hi)", () => {
    assert.equal(languageFrom("hi"), "hi");
  });
  test("accepts Telugu (te) - new language from VED-12", () => {
    assert.equal(languageFrom("te"), "te");
  });
  test("accepts Malayalam (ml) - new language from VED-12", () => {
    assert.equal(languageFrom("ml"), "ml");
  });
  test("falls back to en for unknown language code", () => {
    assert.equal(languageFrom("fr"), "en");
  });
  test("falls back to en for empty string", () => {
    assert.equal(languageFrom(""), "en");
  });
  test("falls back to en for undefined", () => {
    assert.equal(languageFrom(undefined), "en");
  });
  test("LANGUAGES set has exactly 5 entries", () => {
    assert.equal(LANGUAGES.size, 5);
  });
  test("LANGUAGES set contains all required codes", () => {
    for (const code of ["en", "ta", "hi", "te", "ml"]) {
      assert.ok(LANGUAGES.has(code), `LANGUAGES should contain '${code}'`);
    }
  });
});

// ─── 6. Product required-field validation (simulate controller logic) ──────────
describe("Product required-field validation", () => {
  const REQUIRED = ["productName", "category", "material", "weight", "mrp", "sellingPrice"];

  const validateRequired = (body) =>
    REQUIRED.filter((field) => !String(body[field] ?? "").trim());

  test("valid product passes all required checks", () => {
    const body = {
      productName: "Pure Brass Pooja Diya",
      category: "Pooja Essentials",
      material: "Brass",
      weight: "250g",
      mrp: "599",
      sellingPrice: "499",
    };
    assert.deepEqual(validateRequired(body), []);
  });

  test("missing productName is caught", () => {
    const body = { category: "Pooja", material: "Brass", weight: "250g", mrp: "599", sellingPrice: "499" };
    const missing = validateRequired(body);
    assert.ok(missing.includes("productName"));
  });

  test("missing mrp is caught", () => {
    const body = { productName: "Diya", category: "Pooja", material: "Brass", weight: "250g", sellingPrice: "499" };
    const missing = validateRequired(body);
    assert.ok(missing.includes("mrp"));
  });

  test("whitespace-only productName is treated as missing", () => {
    const body = { productName: "   ", category: "Pooja", material: "Brass", weight: "250g", mrp: "599", sellingPrice: "499" };
    const missing = validateRequired(body);
    assert.ok(missing.includes("productName"));
  });
});

// ─── 7. MRP vs Selling Price validation ───────────────────────────────────────
describe("MRP vs Selling Price validation", () => {
  const validatePrices = (mrp, sellingPrice) => {
    const m = Number(mrp);
    const s = Number(sellingPrice);
    if (m <= 0) return "mrp must be greater than 0";
    if (s <= 0) return "sellingPrice must be greater than 0";
    if (s > m) return "sellingPrice cannot exceed mrp";
    return null;
  };

  test("selling price less than mrp is valid", () => {
    assert.equal(validatePrices("599", "499"), null);
  });
  test("selling price equal to mrp is valid", () => {
    assert.equal(validatePrices("499", "499"), null);
  });
  test("selling price exceeding mrp is invalid", () => {
    assert.equal(validatePrices("499", "599"), "sellingPrice cannot exceed mrp");
  });
  test("selling price of 0 is invalid", () => {
    assert.equal(validatePrices("499", "0"), "sellingPrice must be greater than 0");
  });
  test("negative mrp is invalid", () => {
    assert.equal(validatePrices("-100", "50"), "mrp must be greater than 0");
  });
});
