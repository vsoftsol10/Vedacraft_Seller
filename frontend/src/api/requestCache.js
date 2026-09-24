const cache = new Map();

// Deduplicates concurrent reads and serves a recent result during route changes.
// Values are kept only in memory, so a browser refresh always starts fresh.
export function cachedRequest(key, request, ttlMs = 30_000) {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;

  const value = Promise.resolve().then(request);
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  value.catch(() => {
    if (cache.get(key)?.value === value) cache.delete(key);
  });
  return value;
}

export function invalidateCachedRequests(prefix = "") {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
