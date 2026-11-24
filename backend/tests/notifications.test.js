// Tests for notification sync TTL cache logic (notificationController.js)
// and offer notification classification logic (notifications.js)

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ─── TTL Cache logic (mirrored from notificationController) ───────────────────
const makeCache = (ttlMs = 2 * 60 * 1000) => {
  const store = new Map();
  const shouldSync = (sellerId) => {
    const expiresAt = store.get(sellerId);
    if (expiresAt && Date.now() < expiresAt) return false;
    store.set(sellerId, Date.now() + ttlMs);
    return true;
  };
  return { shouldSync, store };
};

describe("Notification sync TTL cache", () => {
  test("first call always triggers sync", () => {
    const { shouldSync } = makeCache(60_000);
    assert.equal(shouldSync("seller-1"), true);
  });

  test("second immediate call within TTL does NOT trigger sync", () => {
    const { shouldSync } = makeCache(60_000);
    shouldSync("seller-1"); // first call
    assert.equal(shouldSync("seller-1"), false); // should be cached
  });

  test("different sellers are cached independently", () => {
    const { shouldSync } = makeCache(60_000);
    shouldSync("seller-A");
    assert.equal(shouldSync("seller-B"), true); // seller-B is fresh
  });

  test("expired TTL triggers sync again", () => {
    const { shouldSync } = makeCache(1); // 1ms TTL
    shouldSync("seller-1");
    // Wait for TTL to expire
    return new Promise((resolve) => setTimeout(() => {
      assert.equal(shouldSync("seller-1"), true); // TTL expired
      resolve();
    }, 5));
  });

  test("cache stores expiry per seller", () => {
    const { shouldSync, store } = makeCache(5000);
    shouldSync("seller-X");
    assert.ok(store.has("seller-X"));
    assert.ok(store.get("seller-X") > Date.now());
  });
});

// ─── Offer notification classification (mirrored from notifications.js) ────────
const offerNotification = (offer, now) => {
  const start = offer.start_date ? new Date(offer.start_date) : null;
  const end = offer.end_date ? new Date(offer.end_date) : null;
  const tomorrowStart = new Date(now); tomorrowStart.setUTCHours(24, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
  const name = offer.offer_name;
  if (end && end <= now) return { type: "offer_ended", title: "Offer ended", message: `Your offer "${name}" has ended.` };
  if (start && start >= tomorrowStart && start < tomorrowEnd) return { type: "offer_starts_tomorrow", title: "Offer starts tomorrow", message: `Your offer "${name}" starts tomorrow.` };
  if (offer.is_active && (!start || start <= now) && (!end || end > now)) return { type: "offer_active", title: "Offer is active", message: `Your offer "${name}" is now active.` };
  return null;
};

describe("offerNotification classification", () => {
  const NOW = new Date("2026-11-19T10:00:00Z");

  test("active offer (no dates) returns offer_active", () => {
    const result = offerNotification({ offer_name: "Summer Sale", is_active: true, start_date: null, end_date: null }, NOW);
    assert.equal(result?.type, "offer_active");
  });

  test("ended offer returns offer_ended", () => {
    const result = offerNotification({
      offer_name: "Old Sale", is_active: true,
      start_date: "2026-11-01T00:00:00Z",
      end_date: "2026-11-10T00:00:00Z"
    }, NOW);
    assert.equal(result?.type, "offer_ended");
  });

  test("offer starting tomorrow returns offer_starts_tomorrow", () => {
    const tomorrow = new Date(NOW);
    tomorrow.setUTCHours(24, 0, 0, 0);
    const result = offerNotification({
      offer_name: "Flash Sale", is_active: false,
      start_date: tomorrow.toISOString(),
      end_date: null,
    }, NOW);
    assert.equal(result?.type, "offer_starts_tomorrow");
  });

  test("inactive offer with no end date returns null", () => {
    const result = offerNotification({
      offer_name: "Paused Sale", is_active: false,
      start_date: null, end_date: null,
    }, NOW);
    assert.equal(result, null);
  });

  test("future offer not yet started returns null", () => {
    const result = offerNotification({
      offer_name: "Upcoming", is_active: false,
      start_date: "2026-12-25T00:00:00Z",
      end_date: "2026-12-31T00:00:00Z",
    }, NOW);
    assert.equal(result, null);
  });
});
