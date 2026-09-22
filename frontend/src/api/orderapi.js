import api from "./productapi";

const ordersEndpoint = import.meta.env.VITE_ORDERS_ENDPOINT || "/orders";
export const getOrders = () => api.get(ordersEndpoint).then((response) => response.data);
