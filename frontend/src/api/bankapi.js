import client from './productapi';
import { cachedRequest, invalidateCachedRequests } from './requestCache';

export async function fetchBankDetails() {
  return cachedRequest('bank-details', () => client.get('/bank-details').then(({ data }) => data.data), 60_000);
}

export async function saveBankDetails(values) {
  const { data } = await client.put('/bank-details', values);
  invalidateCachedRequests('bank-details');
  return data.data;
}

export function parseBankApiError(err) {
  const payload = err?.response?.data;
  return { message: payload?.message || (err?.request && !err?.response ? 'Cannot reach the server. Check your connection and try again.' : err?.message) || 'Something went wrong. Please try again.', fieldErrors: payload?.errors || {} };
}
