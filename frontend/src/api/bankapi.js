import client from './productapi';

export async function fetchBankDetails() {
  const { data } = await client.get('/bank-details');
  return data.data;
}

export async function saveBankDetails(values) {
  const { data } = await client.put('/bank-details', values);
  return data.data;
}

export function parseBankApiError(err) {
  const payload = err?.response?.data;
  return { message: payload?.message || (err?.request && !err?.response ? 'Cannot reach the server. Check your connection and try again.' : err?.message) || 'Something went wrong. Please try again.', fieldErrors: payload?.errors || {} };
}
