import api from "./productapi";
import { cachedRequest, invalidateCachedRequests } from "./requestCache";

const ordersEndpoint = import.meta.env.VITE_ORDERS_ENDPOINT || "/orders";
export const getOrders = () => cachedRequest("orders", () => api.get(ordersEndpoint).then((response) => response.data), 15_000);
export const updateOrderStatus = (id, status) =>
  api.patch(`${ordersEndpoint}/${encodeURIComponent(id)}/status`, { status }).then((response) => { invalidateCachedRequests("orders"); return response.data; });
