import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthStore } from '../lib/auth-store';

// Guard ตรวจสอบว่า user login แล้วหรือยัง — ถ้ายังให้ redirect ไป /login
interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { accessToken, user } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !user) {
    // เก็บ path ที่กำลังจะไปไว้ใน state เพื่อกลับไปหลัง login สำเร็จ
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
