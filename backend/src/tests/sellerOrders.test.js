import { describe, it, expect, vi } from "vitest";

// Mock supabase to satisfy top-level import in sellerOrders.js without touching live DB
vi.mock("../config/supabase.js", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { orderItems, matchedSellerItems } from "../services/sellerOrders.js";

describe("sellerOrders Service Unit Tests (VED-06 / VED-01)", () => {
  describe("orderItems parser", () => {
    it("should return items array as-is if already an array", () => {
      const arr = [{ id: "1" }, { id: "2" }];
      expect(orderItems(arr)).toBe(arr);
    });

    it("should parse stringified JSON items safely", () => {
      const json = JSON.stringify([{ id: "p1" }]);
      expect(orderItems(json)).toEqual([{ id: "p1" }]);
    });

    it("should return empty array on invalid JSON or null", () => {
      expect(orderItems("not-a-json")).toEqual([]);
      expect(orderItems(null)).toEqual([]);
      expect(orderItems(undefined)).toEqual([]);
    });
  });

  describe("matchedSellerItems filter", () => {
    it("should filter only items belonging to the seller's productIds set", () => {
      const order = {
        items: [
          { id: "my-prod-1", name: "Pottery" },
          { id: "other-seller-prod", name: "Silk Shawl" },
          { id: "my-prod-2", name: "Brass Lamp" },
        ],
      };

      const myProductIds = new Set(["my-prod-1", "my-prod-2"]);
      const matched = matchedSellerItems(order, myProductIds);

      expect(matched.length).toBe(2);
      expect(matched.map((item) => item.id)).toEqual(["my-prod-1", "my-prod-2"]);
    });

    it("should return empty array if order contains no products for this seller", () => {
      const order = {
        items: [{ id: "stranger-prod" }],
      };
      const myProductIds = new Set(["my-prod-1"]);
      expect(matchedSellerItems(order, myProductIds)).toEqual([]);
    });
  });
});
