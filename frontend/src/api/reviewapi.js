import client from "./productapi";

export async function fetchReviews(params = {}) {
  const { data } = await client.get("/reviews", { params });
  return data;
}

export async function fetchReviewStats() {
  const { data } = await client.get("/reviews/stats");
  return data.data;
}
