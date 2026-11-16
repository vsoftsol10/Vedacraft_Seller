import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock supabase before importing controllers/routes
vi.mock("../config/supabase.js", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

// Mock notifications service to avoid background external calls
vi.mock("../services/notifications.js", () => ({
  recordSellerLogin: vi.fn().mockResolvedValue({}),
}));

import { supabase } from "../config/supabase.js";
import authRoutes from "../routes/authRoutes.js";
import { buildApp, makeToken } from "./helpers/testApp.js";

describe("Login & Authentication Module (VED-06)", () => {
  const app = buildApp(authRoutes, null, null);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SELLER_PASSWORD_ENCRYPTION_KEY = "test-encryption-key-for-auth";
    process.env.SELLER_SESSION_SECRET = "test-session-secret-key-12345";
  });

  describe("POST /api/auth/login", () => {
    it("should successfully authenticate seller with valid sellerCode and password", async () => {
      const mockSeller = {
        application_id: "seller-uuid-123",
        seller_code: "VSELL-001",
        username: "artisan_crafts",
        must_change_password: false,
      };

      supabase.rpc.mockResolvedValueOnce({
        data: [mockSeller],
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ sellerCode: "VSELL-001", password: "ValidPassword123!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller).toEqual({
        sellerId: "seller-uuid-123",
        sellerCode: "VSELL-001",
        username: "artisan_crafts",
        applicationId: "seller-uuid-123",
        mustChangePassword: false,
      });
      expect(typeof res.body.token).toBe("string");
      expect(res.body.token.split(".").length).toBe(2);

      expect(supabase.rpc).toHaveBeenCalledWith("authenticate_seller", {
        p_seller_code: "VSELL-001",
        p_password: "ValidPassword123!",
        p_encryption_key: "test-encryption-key-for-auth",
      });
    });

    it("should return mustChangePassword: true if seller requires mandatory password reset (VED-03)", async () => {
      const mockSeller = {
        application_id: "seller-uuid-456",
        seller_code: "VSELL-002",
        username: "new_seller",
        must_change_password: true,
      };

      supabase.rpc.mockResolvedValueOnce({
        data: [mockSeller],
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ sellerCode: "VSELL-002", password: "TempPassword123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller.mustChangePassword).toBe(true);
    });

    it("should return 400 when sellerCode or password is missing", async () => {
      const resNoPass = await request(app)
        .post("/api/auth/login")
        .send({ sellerCode: "VSELL-001" });

      expect(resNoPass.status).toBe(400);
      expect(resNoPass.body.success).toBe(false);
      expect(resNoPass.body.message).toContain("required");

      const resNoCode = await request(app)
        .post("/api/auth/login")
        .send({ password: "somePassword" });

      expect(resNoCode.status).toBe(400);
      expect(resNoCode.body.success).toBe(false);
    });

    it("should return 401 on invalid seller code or incorrect password", async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ sellerCode: "VSELL-INVALID", password: "WrongPassword" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid seller code or password.");
    });

    it("should return 403 if seller has no application_id linked", async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: [{ seller_code: "VSELL-NO-APP", username: "orphan" }],
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ sellerCode: "VSELL-NO-APP", password: "ValidPassword123!" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("no application ID");
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should return generic message for invalid email format without querying database", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "invalid-email-format" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("we have sent a password-reset link");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should return generic success message even when email is not found (anti-enumeration)", async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "unknown@seller.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("we have sent a password-reset link");
    });

    it("should return 503 if email service is not configured (missing BREVO keys)", async () => {
      delete process.env.BREVO_API_KEY;
      delete process.env.BREVO_SENDER_EMAIL;

      supabase.from = vi.fn((table) => {
        if (table === "seller_applications") {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "app-123", full_name: "Kavitha", business_email: "seller@test.com" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "seller_credentials") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { application_id: "app-123" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "seller_password_reset_tokens") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "seller@test.com" });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("BREVO_API_KEY");
    });

    it("should return 502 if email provider fails to send email", async () => {
      process.env.BREVO_API_KEY = "mock-brevo-key";
      process.env.BREVO_SENDER_EMAIL = "sender@vedacrafts.com";

      // Mock global fetch for Brevo failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue("Invalid sender address"),
      });

      supabase.from = vi.fn((table) => {
        if (table === "seller_applications") {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "app-123", full_name: "Kavitha", business_email: "seller@test.com" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "seller_credentials") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { application_id: "app-123" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "seller_password_reset_tokens") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "seller@test.com" });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Brevo could not send");

      global.fetch = originalFetch;
    });
  });

  describe("POST /api/auth/reset-password", () => {
    const validToken = "a".repeat(64); // 64 hex characters

    it("should return 400 when token format is invalid or password length is out of range", async () => {
      // Invalid token format
      const resBadToken = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "short-token", password: "NewPassword123!" });

      expect(resBadToken.status).toBe(400);
      expect(resBadToken.body.message).toContain("Use a valid reset link");

      // Password too short (< 8 chars)
      const resShortPass = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, password: "123" });

      expect(resShortPass.status).toBe(400);
      expect(resShortPass.body.message).toContain("between 8 and 128 characters");
    });

    it("should return 400 when reset token is invalid or expired", async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: false, // RPC returned false (invalid or expired token)
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, password: "ValidNewPassword123!" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("This reset link is invalid or has expired");
    });

    it("should return 200 on successful password reset", async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, password: "ValidNewPassword123!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Your password has been reset");
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("should return 400 when currentPassword or newPassword is missing", async () => {
      const validToken = makeToken({ application_id: "seller-123" });
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", validToken)
        .send({ currentPassword: "OldPassword123!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Current and new password are required");
    });

    it("should return 400 when new password is identical to current password", async () => {
      const validToken = makeToken({ application_id: "seller-123" });
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", validToken)
        .send({ currentPassword: "SamePassword123!", newPassword: "SamePassword123!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("New password must be different");
    });

    it("should return 400 if current password verification fails in database", async () => {
      const validToken = makeToken({ application_id: "seller-123" });
      supabase.rpc.mockResolvedValueOnce({
        data: false,
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", validToken)
        .send({ currentPassword: "WrongCurrentPassword!", newPassword: "BrandNewPassword123!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Current password is incorrect.");
    });

    it("should return 200 on successful password change", async () => {
      const validToken = makeToken({ application_id: "seller-123" });
      supabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      });

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", validToken)
        .send({ currentPassword: "CorrectCurrentPassword!", newPassword: "BrandNewPassword123!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password updated successfully.");
    });
  });
});
