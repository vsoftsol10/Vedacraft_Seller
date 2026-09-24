import client from "./productapi";
import { cachedRequest } from "./requestCache";

export async function fetchReviews(params = {}) {
  const key = `reviews:${JSON.stringify(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)))}`;
  return cachedRequest(key, () => client.get("/reviews", { params }).then(({ data }) => data), 15_000);
}

export async function fetchReviewStats() {
  return cachedRequest("reviews:stats", () => client.get("/reviews/stats").then(({ data }) => data.data), 15_000);
}
