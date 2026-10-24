import api, { unwrap } from './api.js';

export const authService = {
  me: () => unwrap(api.get('/auth/me')),
  login: (credentials) => unwrap(api.post('/auth/login', credentials)),
  register: (data) => unwrap(api.post('/auth/register', data)),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.put('/auth/password', data).then((res) => res.data),
};
