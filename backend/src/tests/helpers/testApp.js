/**
 * Shared test-app factory.
 * Creates a fresh Express instance every time it is called so each test file
 * gets an isolated router (no cross-test state leaks).
 *
 * No live Supabase connection is used here — all external dependencies are
 * mocked at the vi.mock() / vi.stubEnv() level in each test file.
 */
import express from "express";
import { createSellerToken } from "../../middlewares/sellerAuth.js";

export function buildApp(authRouter, orderRouter, earningsRouter) {
  const app = express();
  app.use(express.json());

  if (authRouter) app.use("/api/auth", authRouter);
  if (orderRouter) app.use("/api/orders", orderRouter);
  if (earningsRouter) app.use("/api/earnings", earningsRouter);

  // Global error handler matching server.js so status codes are preserved
  app.use((error, _req, res, _next) => {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  });

  return app;
}

/**
 * Creates a valid Bearer token for the given seller without hitting Supabase.
 * Uses the same HMAC-SHA256 logic as createSellerToken in sellerAuth.js.
 */
export function makeToken(sellerOverrides = {}) {
  const seller = {
    application_id: "test-seller-uuid-001",
    seller_code: "VSELL-TEST",
    must_change_password: false,
    ...sellerOverrides,
  };
  return `Bearer ${createSellerToken(seller)}`;
}

