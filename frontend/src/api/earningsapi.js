import api from "./productapi";

export const getEarnings = (period = "thisMonth") =>
  api.get("/earnings", { params: { period } }).then((response) => response.data);
