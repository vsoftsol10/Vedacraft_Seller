import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock dependencies before imports
vi.mock("../config/supabase.js", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../services/sellerOrders.js", () => ({
  getSellerOrders: vi.fn(),
  matchedSellerItems: vi.fn(),
}));

import { supabase } from "../config/supabase.js";
import { getSellerOrders, matchedSellerItems } from "../services/sellerOrders.js";
import orderRoutes from "../routes/orderRoutes.js";
import { buildApp, makeToken } from "./helpers/testApp.js";

describe("Orders Module & Seller Isolation (VED-06 / VED-01)", () => {
  const app = buildApp(null, orderRoutes, null);
  const sellerId = "seller-uuid-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication & Authorization Guard", () => {
    it("should reject requests without authorization token with 401", async () => {
      const res = await request(app).get("/api/orders");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Sign in is required.");
    });

    it("should reject requests with invalid or forged token with 401", async () => {
      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", "Bearer invalid.forged.signature");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject requests with expired token with 401", async () => {
      // Craft a token with expired timestamp
      const expiredPayload = Buffer.from(JSON.stringify({
        sellerId: "seller-123",
        sellerCode: "VSELL-001",
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      })).toString("base64url");

      const crypto = await import("crypto");
      const secret = process.env.SELLER_SESSION_SECRET || "test-secret-key-32-chars-long-abc!";
      const sig = crypto.createHmac("sha256", secret).update(expiredPayload).digest("base64url");
      const expiredToken = `Bearer ${expiredPayload}.${sig}`;

      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", expiredToken);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("session has expired");
    });
  });

  describe("GET /api/orders - Seller Data Isolation (VED-01)", () => {
    it("should return only orders containing the authenticated seller's products", async () => {
      const validToken = makeToken({ application_id: sellerId, seller_code: "VSELL-001" });
      const mockSellerOrders = [
        {
          id: "order-1",
          order_number: "ORD-1001",
          status: "Processing",
          created_at: "2026-11-10T10:00:00Z",
          product: "Clay Pot",
          item_count: 2,
          total: 500,
          items: [{ id: "prod-1", name: "Clay Pot", quantity: 2, sellingPrice: 250 }],
        },
      ];

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(["prod-1"]),
        orders: mockSellerOrders,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                full_name: "Kavitha",
                store_name: "Kavitha Crafts",
                address_line1: "123 Temple St",
                city: "Tirunelveli",
                state: "TN",
                pin_code: "627001",
                country: "India",
              },
              error: null,
            }),
          }),
        }),
      });
      supabase.from = mockFrom;

      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe("order-1");
      expect(res.body.data[0].product).toBe("Clay Pot");
      expect(res.body.data[0].return_address.name).toBe("Kavitha Crafts");

      // Verify getSellerOrders was strictly scoped to the authenticated seller ID
      expect(getSellerOrders).toHaveBeenCalledWith(sellerId);
    });

    it("should return empty array gracefully when seller has zero orders", async () => {
      const validToken = makeToken({ application_id: sellerId });

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(),
        orders: [],
      });

      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it("should forward database failure errors with appropriate status code", async () => {
      const validToken = makeToken({ application_id: sellerId });

      getSellerOrders.mockRejectedValueOnce(
        Object.assign(new Error("Supabase connection timeout"), { status: 500 })
      );

      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", validToken);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Supabase connection timeout");
    });
  });

  describe("PATCH /api/orders/:id/status - Status Progression Rules", () => {
    it("should allow sequential status progression from Placed to Processing", async () => {
      const validToken = makeToken({ application_id: sellerId, seller_code: "VSELL-001" });
      const orderId = "order-test-123";

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(["prod-1"]),
      });

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: orderId, status: "Placed" },
            error: null,
          }),
        }),
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: orderId, status: "Processing", delivered_at: null },
              error: null,
            }),
          }),
        }),
      });

      supabase.from = vi.fn((tableName) => {
        if (tableName === "orders") {
          return {
            select: selectMock,
            update: updateMock,
          };
        }
        return {};
      });

      matchedSellerItems.mockReturnValueOnce([{ id: "prod-1" }]);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", validToken)
        .send({ status: "Processing" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Processing");
    });

    it("should automatically stamp delivered_at when marking order as Delivered", async () => {
      const validToken = makeToken({ application_id: sellerId, seller_code: "VSELL-001" });
      const orderId = "order-test-delivered";

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(["prod-1"]),
      });

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: orderId, status: "Shipped", delivered_at: null },
            error: null,
          }),
        }),
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: orderId, status: "Delivered", delivered_at: "2026-11-16T10:00:00Z" },
              error: null,
            }),
          }),
        }),
      });

      supabase.from = vi.fn((tableName) => {
        if (tableName === "orders") {
          return { select: selectMock, update: updateMock };
        }
        return {};
      });

      matchedSellerItems.mockReturnValueOnce([{ id: "prod-1" }]);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", validToken)
        .send({ status: "Delivered" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Delivered");
      expect(res.body.data.delivered_at).toBe("2026-11-16T10:00:00Z");
    });

    it("should return 400 when invalid status is submitted", async () => {
      const validToken = makeToken({ application_id: sellerId });

      const res = await request(app)
        .patch("/api/orders/order-123/status")
        .set("Authorization", validToken)
        .send({ status: "InvalidStatusXYZ" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("status must be one of Processing, Packed, Shipped, Delivered");
    });

    it("should reject non-sequential status jump with 409 Conflict", async () => {
      const validToken = makeToken({ application_id: sellerId, seller_code: "VSELL-001" });
      const orderId = "order-test-123";

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(["prod-1"]),
      });

      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: orderId, status: "Placed" },
              error: null,
            }),
          }),
        }),
      });

      matchedSellerItems.mockReturnValueOnce([{ id: "prod-1" }]);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", validToken)
        .send({ status: "Shipped" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Order status can only move forward from Placed to Processing.");
    });

    it("should reject updating an already Delivered order with 409 Conflict", async () => {
      const validToken = makeToken({ application_id: sellerId });
      const orderId = "order-already-delivered";

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(["prod-1"]),
      });

      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: orderId, status: "Delivered" },
              error: null,
            }),
          }),
        }),
      });

      matchedSellerItems.mockReturnValueOnce([{ id: "prod-1" }]);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", validToken)
        .send({ status: "Delivered" });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("Delivered orders cannot be updated further.");
    });

    it("should return 404 if target order does not exist in database", async () => {
      const validToken = makeToken({ application_id: sellerId });

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(["prod-1"]),
      });

      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const res = await request(app)
        .patch("/api/orders/non-existent-order/status")
        .set("Authorization", validToken)
        .send({ status: "Processing" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Order not found");
    });

    it("should return 404 if seller does not own any items in the target order", async () => {
      const validToken = makeToken({ application_id: sellerId, seller_code: "VSELL-001" });
      const orderId = "unowned-order-999";

      getSellerOrders.mockResolvedValueOnce({
        productIds: new Set(["prod-1"]),
      });

      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: orderId, status: "Placed", items: [{ id: "other-seller-prod" }] },
              error: null,
            }),
          }),
        }),
      });

      matchedSellerItems.mockReturnValueOnce([]);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", validToken)
        .send({ status: "Processing" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Order not found");
    });
  });
});
