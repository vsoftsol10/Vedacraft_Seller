import client from './productapi';

export async function fetchSellingLocations() {
  const { data } = await client.get('/selling-locations');
  return data.data;
}

export async function replaceSellingLocationState(state, cities) {
  const { data } = await client.put(`/selling-locations/${encodeURIComponent(state)}`, { cities });
  return data.data;
}

export async function deleteSellingLocationState(state) {
  const { data } = await client.delete(`/selling-locations/${encodeURIComponent(state)}`);
  return data.data;
}

export function parseSellingLocationApiError(err) {
  const payload = err?.response?.data;
  return { message: payload?.message || (err?.request && !err?.response ? 'Cannot reach the server. Check your connection and try again.' : err?.message) || 'Something went wrong. Please try again.', fieldErrors: payload?.errors || {} };
}
