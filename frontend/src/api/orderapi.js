import api from "./productapi";

const ordersEndpoint = import.meta.env.VITE_ORDERS_ENDPOINT || "/orders";
export const getOrders = () => api.get(ordersEndpoint).then((response) => response.data);
<<<<<<< HEAD
=======
export const updateOrderStatus = (id, status) =>
  api.patch(`${ordersEndpoint}/${encodeURIComponent(id)}/status`, { status }).then((response) => response.data);
>>>>>>> 78e1cc33d0dad5fb46c601957e814d18b2277c7a
