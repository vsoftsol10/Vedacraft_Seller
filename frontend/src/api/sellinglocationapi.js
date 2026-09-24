import client from './productapi';
import { cachedRequest, invalidateCachedRequests } from './requestCache';

export async function fetchSellingLocations() {
  return cachedRequest('selling-locations', () => client.get('/selling-locations').then(({ data }) => data.data), 60_000);
}

export async function replaceSellingLocationState(state, cities) {
  const { data } = await client.put(`/selling-locations/${encodeURIComponent(state)}`, { cities });
  invalidateCachedRequests('selling-locations');
  return data.data;
}

export async function deleteSellingLocationState(state) {
  const { data } = await client.delete(`/selling-locations/${encodeURIComponent(state)}`);
  invalidateCachedRequests('selling-locations');
  return data.data;
}

export function parseSellingLocationApiError(err) {
  const payload = err?.response?.data;
  return { message: payload?.message || (err?.request && !err?.response ? 'Cannot reach the server. Check your connection and try again.' : err?.message) || 'Something went wrong. Please try again.', fieldErrors: payload?.errors || {} };
}
