import client from "./productapi";

export const fetchOffers = () => client.get("/offers").then((response) => response.data);
export const createOffer = (payload) => client.post("/offers", payload).then((response) => response.data);
export const updateOffer = (id, payload) => client.put(`/offers/${id}`, payload).then((response) => response.data);
export const toggleOffer = (id, isActive) => client.patch(`/offers/${id}/toggle`, { isActive }).then((response) => response.data);
export const reuseOffer = (id, dates) => client.post(`/offers/${id}/reuse`, dates).then((response) => response.data);
export const extendOffer = (id, dates) => client.patch(`/offers/${id}/extend`, dates).then((response) => response.data);
export const deleteOffer = (id) => client.delete(`/offers/${id}`).then((response) => response.data);
