import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// โครงสร้างข้อมูลผู้ใช้ที่เก็บไว้ใน store
interface User {
  userId: string;
  username: string;
  email?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  mode: 'admin' | 'tenant'; // สลับระหว่างโหมดเจ้าหน้าที่ / ผู้เช่า
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setMode: (mode: 'admin' | 'tenant') => void;
  logout: () => void;
}

// Auth Store — เก็บสถานะการ login ไว้ใน localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      mode: 'admin',
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      setMode: (mode) => set({ mode }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, mode: 'admin' }),
    }),
    { name: 'doa-auth' }
  )
);
