import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API, getToken, setToken, setUnauthorizedHandler } from '@/lib/api';

const AuthContext = createContext(null);

const USER_CACHE_KEY = 'nfe_user_cache';

function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(u) {
  try {
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!getToken()) return null;
    return getCachedUser();
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setCachedUser(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setCachedUser(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let active = true;
    async function restore() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`${API}/auth/me`);
        if (active) {
          setCachedUser(data);
          setUser(data);
        }
      } catch {
        setToken(null);
        setCachedUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { username, password });
    setToken(data.token);
    setCachedUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const hasPermission = useCallback(
    (permission) => !!user && Array.isArray(user.permissoes) && user.permissoes.includes(permission),
    [user],
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

// Constantes de permissao (espelham o backend services/auth.py)
export const PERM = {
  VIEW: 'view',
  CONFERIR: 'conferir',
  NOTAS: 'gerenciar_notas',
  CADASTROS: 'gerenciar_cadastros',
  RELATORIOS: 'relatorios',
  USUARIOS: 'gerenciar_usuarios',
};
