import api from "./productapi";
import { cachedRequest } from "./requestCache";

export const fetchDashboard = () =>
  cachedRequest("dashboard", () => api.get("/dashboard").then(({ data }) => data.data ?? data), 15_000);
