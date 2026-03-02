import axios from 'axios';
import type { User } from '../types';

const api = axios.create({ withCredentials: true });

export const getMe = (): Promise<User> =>
  api.get('/api/users/me').then(r => r.data);

export const login = (email: string, password: string): Promise<void> =>
  api.post('/api/users/login', { email, password }).then(r => r.data);

export const signup = (username: string, email: string, password: string): Promise<void> =>
  api.post('/api/users/', { username, email, password }).then(r => r.data);

export const logout = (): Promise<void> =>
  api.post('/api/users/logout').then(r => r.data);
