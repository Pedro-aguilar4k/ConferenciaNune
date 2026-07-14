import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API, getToken, setToken, setUnauthorizedHandler } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Reage a respostas 401 (token expirado/invalido) deslogando o usuario.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  // Ao montar, tenta restaurar a sessao a partir do token salvo.
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
        if (active) setUser(data);
      } catch {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { username, password });
    setToken(data.token);
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
