import api from "./productapi";

export const loginSeller = ({ sellerCode, password }) =>
  api.post("/auth/login", { sellerCode, password }).then((response) => response.data);
