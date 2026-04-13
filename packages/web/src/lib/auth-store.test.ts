import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './auth-store';

describe('Auth Store', () => {
  beforeEach(() => {
    // รีเซ็ต store ก่อนทุก test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      mode: 'admin',
    });
  });

  it('เริ่มต้นไม่มี user (ยังไม่ login)', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.mode).toBe('admin');
  });

  it('setAuth เก็บข้อมูลผู้ใช้และ token', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setAuth(
        { userId: 'USR-001', username: 'admin', role: 'ADMIN' },
        'access-token-123',
        'refresh-token-456'
      );
    });

    expect(result.current.user?.userId).toBe('USR-001');
    expect(result.current.user?.username).toBe('admin');
    expect(result.current.accessToken).toBe('access-token-123');
    expect(result.current.refreshToken).toBe('refresh-token-456');
  });

  it('setMode สลับระหว่าง admin/tenant', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => result.current.setMode('tenant'));
    expect(result.current.mode).toBe('tenant');

    act(() => result.current.setMode('admin'));
    expect(result.current.mode).toBe('admin');
  });

  it('logout ล้างข้อมูลทั้งหมด', () => {
    const { result } = renderHook(() => useAuthStore());

    // login ก่อน
    act(() => {
      result.current.setAuth(
        { userId: 'USR-001', username: 'admin', role: 'ADMIN' },
        'token', 'refresh'
      );
      result.current.setMode('tenant');
    });

    // logout
    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.mode).toBe('admin');
  });
});
