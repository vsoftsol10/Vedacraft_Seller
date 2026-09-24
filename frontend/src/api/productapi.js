import axios from "axios";
import { cachedRequest, invalidateCachedRequests } from "./requestCache";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE_URL });

export const clearSellerSession = () => {
  sessionStorage.removeItem("vedacraftsSeller");
  sessionStorage.removeItem("vedacraftsSellerSettings");
  invalidateCachedRequests();
};

api.interceptors.request.use((config) => {
  let token = null;
  try {
    const savedSession = sessionStorage.getItem("vedacraftsSeller");
    token = savedSession ? JSON.parse(savedSession).token : null;
  } catch {
    clearSellerSession();
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login itself uses a 401 to report invalid credentials. Every other API 401
    // means the seller session is no longer valid, matching the logout flow.
    if (error.response?.status === 401 && error.config?.url !== "/auth/login") {
      clearSellerSession();
      if (window.location.pathname !== "/login") window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);

const cacheKey = (name, params = {}) => `${name}:${JSON.stringify(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)))}`;

export const getProducts = (params = {}) =>
  cachedRequest(cacheKey("products", params), () => api.get("/products", { params }).then((res) => res.data), 20_000);

export const getProductStats = () =>
  cachedRequest("products:stats", () => api.get("/products/stats").then((res) => res.data), 20_000);

export const getProductCategories = () =>
  cachedRequest("products:categories", () => api.get("/products/categories").then((res) => res.data), 60_000);

export const getProductById = (id) =>
  cachedRequest(`products:item:${id}`, () => api.get(`/products/${id}`).then((res) => res.data), 20_000);

export const createProduct = (formData) =>
  api
    .post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => { invalidateCachedRequests("products:"); return res.data; });

export const updateProduct = (id, formData) =>
  api
    .put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => { invalidateCachedRequests("products:"); return res.data; });

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((res) => { invalidateCachedRequests("products:"); return res.data; });

export const updateProductStatus = (id, isActive) =>
  api.patch(`/products/${id}/status`, { isActive }).then((res) => { invalidateCachedRequests("products:"); return res.data; });




export const previewBulkProducts = (sheetFile, imageFiles, onUploadProgress) => {
  const formData = new FormData();
  formData.append("sheet", sheetFile);
  imageFiles.forEach((file) => formData.append("images", file));

  return api
    .post("/products/bulk-preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })
    .then((res) => res.data); // { success, data: [{rowId, body, productId, images, errors, isValid}] }
};

export const confirmBulkProducts = (rows, imageFiles) => {
  const formData = new FormData();
  formData.append("rows", JSON.stringify(rows));
  imageFiles.forEach((file) => formData.append("images", file));
  return api
    .post("/products/bulk-confirm", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data); // { success, data: { success: [...], failed: [...] } }
};

export const downloadBulkProductTemplate = () =>
  api.get("/products/bulk-template", { responseType: "blob" }).then((res) => res.data);





export default api;
