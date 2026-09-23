import client from './productapi';

export async function fetchBusiness() {
  const { data } = await client.get('/business');
  return data.data;
}

export async function saveBusiness(values) {
  const payload = {
    storeName: values.storeName,
    storeType: values.storeType,
    storeDescription: values.storeDescription,
  };
  if (values.businessName) payload.businessName = values.businessName;
  const { data } = await client.put('/business', payload);
  return data.data;
}

export function parseBusinessApiError(err) {
  const payload = err?.response?.data;
  return {
    message:
      payload?.message ||
      (err?.request && !err?.response
        ? 'Cannot reach the server. Check your connection and try again.'
        : err?.message) ||
      'Something went wrong. Please try again.',
    fieldErrors: payload?.errors || {},
  };
}
