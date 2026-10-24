import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService.js';
import { isServiceUnavailable } from '../services/api.js';

const AuthContext = createContext(null);

/*
 * Holds the logged-in user for the whole app.
 * The login token itself lives in an httpOnly cookie that JavaScript cannot read;
 * we only learn who is logged in by asking the server (GET /api/auth/me).
 *
 * status: 'loading' (first check running) | 'ready' | 'unavailable' (server/database down)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [status, setStatus] = useState('loading');

  const applyAuth = useCallback((data) => {
    setUser(data?.user || null);
    setProfileCompletion(data?.profileCompletion || null);
  }, []);

  const checkAuth = useCallback(async () => {
    setStatus('loading');
    try {
      applyAuth(await authService.me());
      setStatus('ready');
    } catch (err) {
      applyAuth(null);
      // 401 just means "not logged in". Anything else means we could not check.
      setStatus(isServiceUnavailable(err) ? 'unavailable' : 'ready');
    }
  }, [applyAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Any API call that returns 401 (e.g. token expired) logs the user out locally.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser((current) => {
        if (current) toast.error('Your session has ended. Please log in again.', { id: 'session-expired' });
        return null;
      });
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const data = await authService.login(credentials);
      applyAuth(data);
      setStatus('ready');
      return data.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (form) => {
      const data = await authService.register(form);
      applyAuth(data);
      setStatus('ready');
      return data.user;
    },
    [applyAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear local state even if the request failed, so the UI never shows a stale login.
      applyAuth(null);
    }
  }, [applyAuth]);

  const value = useMemo(
    () => ({ user, status, profileCompletion, login, register, logout, checkAuth, applyAuth }),
    [user, status, profileCompletion, login, register, logout, checkAuth, applyAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
