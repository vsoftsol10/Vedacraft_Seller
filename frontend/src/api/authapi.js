import api from "./productapi";

export const loginSeller = ({ sellerCode, password }) =>
  api.post("/auth/login", { sellerCode, password }).then((response) => response.data);

export const requestPasswordReset = (email) =>
  api.post("/auth/forgot-password", { email }).then((response) => response.data);

export const resetPassword = ({ token, password }) =>
  api.post("/auth/reset-password", { token, password }).then((response) => response.data);
