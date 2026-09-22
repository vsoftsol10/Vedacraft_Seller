// src/api/profileapi.js
import client from './productapi';

export async function fetchProfile() {
  const { data } = await client.get('/profile');
  return data.data;
}

/**
 * values:  { fullName, email, mobileNumber, alternateNumber }
 * options: { imageFile?: File, removeImage?: boolean }
 */
export async function saveProfile(values, { imageFile, removeImage } = {}) {
  const body = new FormData();
  body.append('fullName', values.fullName);
  body.append('email', values.email);
  body.append('mobileNumber', values.mobileNumber);
  body.append('alternateNumber', values.alternateNumber); // '' clears it
  if (imageFile) body.append('profileImage', imageFile);
  if (removeImage) body.append('removeProfileImage', 'true');

  const { data } = await client.put('/profile', body);
  return data.data;
}

/** Turns an Axios error into { message, fieldErrors } for the form. */
export function parseApiError(err) {
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
