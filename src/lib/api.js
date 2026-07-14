// Base da API. Em desenvolvimento o Vite faz proxy de "/api" para o backend
// (ver vite.config.js). Em producao, defina VITE_BACKEND_URL para apontar
// para o backend implantado. Usa import.meta.env (padrao do Vite) em vez de
// process.env, que nao existe no browser.
import axios from "axios";

const backendUrl = import.meta.env?.VITE_BACKEND_URL;

export const API = backendUrl ? `${backendUrl}/api` : "/api";

export const TOKEN_KEY = "nfe_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// Anexa o token JWT em todas as requisicoes automaticamente.
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback registrado pelo AuthContext para reagir a sessao expirada (401).
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default API;
