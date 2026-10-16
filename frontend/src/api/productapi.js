import axios from "axios";
import { cachedRequest, invalidateCachedRequests } from "./requestCache";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SELLER_SESSION_KEY = "vedacraftsSeller";

const api = axios.create({ baseURL: API_BASE_URL });

export const getSellerSession = () => {
  const savedSession = sessionStorage.getItem(SELLER_SESSION_KEY);
  if (!savedSession) return null;

  try {
    const session = JSON.parse(savedSession);
    if (!session?.token) throw new Error("Missing seller session token");
    return session;
  } catch {
    clearSellerSession();
    return null;
  }
};

export const saveSellerSession = (session) => {
  sessionStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(session));
};

export const clearSellerSession = () => {
  sessionStorage.removeItem(SELLER_SESSION_KEY);
  sessionStorage.removeItem("vedacraftsSellerSettings");
  invalidateCachedRequests();
};

api.interceptors.request.use((config) => {
  let token = null;
  try {
    token = getSellerSession()?.token || null;
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
    // A Bank Details update can return 401 when the user mistypes the separate
    // password-confirmation field. That is not an expired seller session.
    const isPasswordConfirmationFailure = error.response?.data?.code === "PASSWORD_CONFIRMATION_FAILED";
    if (error.response?.status === 401 && error.config?.url !== "/auth/login" && !isPasswordConfirmationFailure) {
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

export const getNextProductSku = (productName) =>
  api.get("/products/next-sku", { params: { productName } }).then((res) => res.data);

export const getProductById = (id, lang) =>
  cachedRequest(`products:item:${id}:${lang || "default"}`, () => api.get(`/products/${id}`, { params: lang ? { lang } : undefined }).then((res) => res.data), 20_000);

export const getProductTranslations = (id) => api.get(`/products/${id}/translations`).then((res) => res.data);
export const saveProductTranslation = (id, language, content) => api.put(`/products/${id}/translations/${language}`, content).then((res) => { invalidateCachedRequests("products:"); return res.data; });
export const retryProductTranslations = (id, force = false) => api.post(`/products/${id}/translations/retry?force=${force}`).then((res) => { invalidateCachedRequests("products:"); return res.data; });
export const translateMissingProducts = () => api.post("/products/translations/translate-missing").then((res) => { invalidateCachedRequests("products:"); return res.data; });

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

export const bulkAddStock = (updates) =>
  api.patch("/products/bulk-stock", { updates }).then((res) => { invalidateCachedRequests("products:"); return res.data; });

export const getSellerDocuments = () => api.get("/documents").then((res) => res.data);

export const uploadSellerDocument = (documentType, file) => {
  const formData = new FormData();
  formData.append("documentType", documentType);
  formData.append("document", file);
  return api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data);
};

export const replaceSellerDocument = (id, file) => {
  const formData = new FormData();
  formData.append("document", file);
  return api.put(`/documents/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data);
};




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
