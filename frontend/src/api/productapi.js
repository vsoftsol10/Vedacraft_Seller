import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  let token = null;
  try {
    const savedSession = sessionStorage.getItem("vedacraftsSeller");
    token = savedSession ? JSON.parse(savedSession).token : null;
  } catch {
    sessionStorage.removeItem("vedacraftsSeller");
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getProducts = (params = {}) =>
  api.get("/products", { params }).then((res) => res.data);

export const getProductStats = () =>
  api.get("/products/stats").then((res) => res.data);

export const getProductCategories = () =>
  api.get("/products/categories").then((res) => res.data);

export const getProductById = (id) =>
  api.get(`/products/${id}`).then((res) => res.data);

export const createProduct = (formData) =>
  api
    .post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

export const updateProduct = (id, formData) =>
  api
    .put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((res) => res.data);

export const updateProductStatus = (id, isActive) =>
  api.patch(`/products/${id}/status`, { isActive }).then((res) => res.data);

export default api;
