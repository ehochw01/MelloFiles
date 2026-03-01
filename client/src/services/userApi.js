import axios from 'axios';

const api = axios.create({ withCredentials: true });

export const getMe = () =>
  api.get('/api/users/me').then(r => r.data);

export const login = (email, password) =>
  api.post('/api/users/login', { email, password }).then(r => r.data);

export const signup = (username, email, password) =>
  api.post('/api/users/', { username, email, password }).then(r => r.data);

export const logout = () =>
  api.post('/api/users/logout').then(r => r.data);
