import axios from 'axios';

// One shared axios instance. withCredentials sends the httpOnly login cookie with every request.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});

// When any request comes back 401 (expired/invalid login), tell AuthContext so it can
// clear the user and send them to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Returns only the `data` part of our { success, message, data } responses.
export const unwrap = (promise) => promise.then((res) => res.data.data);

const UNREACHABLE = 'Cannot reach the server right now. Please check that the backend is running and try again.';

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (!error.response) return UNREACHABLE; // network error / server down / timeout
  const msg = error.response.data?.message;
  if (msg) return msg;
  // Dev proxy returns an empty 5xx when Express is stopped.
  if (error.response.status >= 500) return UNREACHABLE;
  return fallback;
}

// Converts [{ field, message }] from the API into { field: message } for forms.
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, e) => {
    // "education[0].degree" -> "education" so the form can show it near the right section
    const key = String(e.field || '').split(/[.[]/)[0] || '_';
    if (!acc[key]) acc[key] = e.message;
    if (e.field && !acc[e.field]) acc[e.field] = e.message;
    return acc;
  }, {});
}

export const isServiceUnavailable = (error) =>
  !error?.response || error.response.status === 503 || (error.response.status >= 500 && !error.response.data?.message);

export default api;
