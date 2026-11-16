import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/**/*.test.js"],
    env: {
      SELLER_SESSION_SECRET: "test-secret-key-32-chars-long-abc!",
      SELLER_PASSWORD_ENCRYPTION_KEY: "test-encryption-key-for-auth",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/controllers/authController.js",
        "src/controllers/orderController.js",
        "src/controllers/earningsController.js",
        "src/services/sellerOrders.js",
        "src/middlewares/sellerAuth.js",
      ],
      reportsDirectory: "./coverage",
    },
    clearMocks: true,
    restoreMocks: true,
  },
});
