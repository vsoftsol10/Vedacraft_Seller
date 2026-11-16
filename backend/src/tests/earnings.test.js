import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock sellerOrders service before import
vi.mock("../services/sellerOrders.js", () => ({
  getSellerOrders: vi.fn(),
  matchedSellerItems: vi.fn(),
}));

import { getSellerOrders, matchedSellerItems } from "../services/sellerOrders.js";
import earningsRoutes from "../routes/earningsRoutes.js";
import { buildApp, makeToken } from "./helpers/testApp.js";

describe("Earnings Calculation Module (VED-06 / VED-02)", () => {
  const app = buildApp(null, null, earningsRoutes);
  const sellerId = "seller-uuid-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate earnings correctly excluding cancelled and returned orders", async () => {
    const validToken = makeToken({ application_id: sellerId });
    const now = new Date().toISOString();

    const mockOrders = [
      {
        id: "order-valid-1",
        status: "Delivered",
        created_at: now,
      },
      {
        id: "order-valid-2",
        status: "Processing",
        created_at: now,
      },
      {
        id: "order-cancelled-3",
        status: "Cancelled",
        created_at: now,
      },
      {
        id: "order-returned-4",
        status: "Returned",
        created_at: now,
      },
    ];

    getSellerOrders.mockResolvedValueOnce({
      productIds: new Set(["prod-1"]),
      orders: mockOrders,
    });

    matchedSellerItems.mockImplementation((order) => {
      if (order.id === "order-valid-1") return [{ sellingPrice: 1000, quantity: 1, name: "Item A" }];
      if (order.id === "order-valid-2") return [{ sellingPrice: 250, quantity: 2, name: "Item B" }]; // 500
      if (order.id === "order-cancelled-3") return [{ sellingPrice: 300, quantity: 1, name: "Item C" }];
      if (order.id === "order-returned-4") return [{ sellingPrice: 200, quantity: 1, name: "Item D" }];
      return [];
    });

    const res = await request(app)
      .get("/api/earnings?period=thisMonth")
      .set("Authorization", validToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;

    // Net active order value must be 1000 + 500 = 1500 (Cancelled & Returned EXCLUDED)
    expect(data.orderValue).toBe(1500);
    expect(data.orderCount).toBe(2);

    // Gross order value must include all selected orders: 1000 + 500 + 300 + 200 = 2000
    expect(data.grossOrderValue).toBe(2000);
    expect(data.grossOrderCount).toBe(4);

    // Deductions must separately report cancelled and returned orders
    expect(data.cancelledOrdersCount).toBe(1);
    expect(data.cancelledOrderValue).toBe(300);
    expect(data.returnedOrdersCount).toBe(1);
    expect(data.returnedOrderValue).toBe(200);

    expect(data.deductions.cancelled).toEqual({ count: 1, value: 300 });
    expect(data.deductions.returned).toEqual({ count: 1, value: 200 });

    // Recent orders check
    expect(Array.isArray(data.recentOrders)).toBe(true);
    expect(data.recentOrders.length).toBe(4);

    // 12-month trend array check
    expect(Array.isArray(data.trend)).toBe(true);
    expect(data.trend.length).toBe(12);
  });

  it("should handle empty orders list gracefully (zeros for all metrics)", async () => {
    const validToken = makeToken({ application_id: sellerId });

    getSellerOrders.mockResolvedValueOnce({
      productIds: new Set(),
      orders: [],
    });

    const res = await request(app)
      .get("/api/earnings")
      .set("Authorization", validToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderValue).toBe(0);
    expect(res.body.data.orderCount).toBe(0);
    expect(res.body.data.grossOrderValue).toBe(0);
    expect(res.body.data.grossOrderCount).toBe(0);
    expect(res.body.data.cancelledOrderValue).toBe(0);
    expect(res.body.data.returnedOrderValue).toBe(0);
    expect(res.body.data.recentOrders).toEqual([]);
    expect(res.body.data.trend.length).toBe(12);
  });

  it("should correctly handle orders with zero value or items with missing sellingPrice", async () => {
    const validToken = makeToken({ application_id: sellerId });
    const now = new Date().toISOString();

    const mockOrders = [
      { id: "zero-val-order", status: "Delivered", created_at: now },
    ];

    getSellerOrders.mockResolvedValueOnce({
      productIds: new Set(["prod-1"]),
      orders: mockOrders,
    });

    // Item has no sellingPrice and no price -> defaults to 0
    matchedSellerItems.mockReturnValueOnce([
      { name: "Free Sample Item", quantity: 1 },
    ]);

    const res = await request(app)
      .get("/api/earnings")
      .set("Authorization", validToken);

    expect(res.status).toBe(200);
    expect(res.body.data.orderCount).toBe(1);
    expect(res.body.data.orderValue).toBe(0);
    expect(res.body.data.grossOrderValue).toBe(0);
  });

  it("should correctly handle period filter (thisMonth vs allTime)", async () => {
    const validToken = makeToken({ application_id: sellerId });
    const thisMonthDate = new Date().toISOString();
    const pastDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const mockOrders = [
      { id: "recent-1", status: "Delivered", created_at: thisMonthDate },
      { id: "past-2", status: "Delivered", created_at: pastDate },
    ];

    getSellerOrders.mockResolvedValue({
      productIds: new Set(["prod-1"]),
      orders: mockOrders,
    });

    matchedSellerItems.mockImplementation((order) => [
      { sellingPrice: 500, quantity: 1, name: order.id },
    ]);

    // Test thisMonth filter
    const resMonth = await request(app)
      .get("/api/earnings?period=thisMonth")
      .set("Authorization", validToken);

    expect(resMonth.status).toBe(200);
    expect(resMonth.body.data.orderCount).toBe(1);
    expect(resMonth.body.data.orderValue).toBe(500);

    // Test allTime filter
    const resAllTime = await request(app)
      .get("/api/earnings?period=allTime")
      .set("Authorization", validToken);

    expect(resAllTime.status).toBe(200);
    expect(resAllTime.body.data.orderCount).toBe(2);
    expect(resAllTime.body.data.orderValue).toBe(1000);
  });

  it("should return 400 for invalid period query parameter", async () => {
    const validToken = makeToken({ application_id: sellerId });
    const res = await request(app)
      .get("/api/earnings?period=invalidPeriod")
      .set("Authorization", validToken);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("period must be thisMonth or allTime");
  });

  it("should handle unexpected errors in getSellerOrders and forward via next(error)", async () => {
    const validToken = makeToken({ application_id: sellerId });

    getSellerOrders.mockRejectedValueOnce(
      Object.assign(new Error("Database unavailable"), { status: 500 })
    );

    const res = await request(app)
      .get("/api/earnings")
      .set("Authorization", validToken);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Database unavailable");
  });
});
