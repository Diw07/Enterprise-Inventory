import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    window.__accessToken = null;
    setUser(null);
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        window.__accessToken = data.data.accessToken;
        const me = await api.get('/auth/me');
        setUser(me.data.data);
      } catch {
        window.__accessToken = null;
      } finally {
        setLoading(false);
      }
    };
    restore();
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    window.__accessToken = data.data.accessToken;
    setUser(data.data.user);
    return data.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
