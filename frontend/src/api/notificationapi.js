import api from "./productapi";

export const fetchNotifications = () => api.get("/notifications").then((response) => response.data);
export const markNotificationsRead = (ids) => api.patch("/notifications/read", ids?.length ? { ids } : {}).then((response) => response.data);
