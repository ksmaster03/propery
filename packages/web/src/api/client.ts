import axios from 'axios';
import { useAuthStore } from '../lib/auth-store';

// Axios instance สำหรับเรียก API — พร้อม interceptor จัดการ token
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// แนบ Access Token + Organization ID ทุก request
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  if (state.accessToken) {
    config.headers.Authorization = `Bearer ${state.accessToken}`;
  }
  // Multi-tenant — ส่ง active org id ไปพร้อม request
  if (state.activeOrgId) {
    config.headers['X-Organization-Id'] = String(state.activeOrgId);
  }
  return config;
});

// จัดการ 401 — ลอง refresh token อัตโนมัติ
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          accessToken,
          newRefresh
        );

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
