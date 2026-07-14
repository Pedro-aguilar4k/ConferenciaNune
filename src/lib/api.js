// Base da API. Em desenvolvimento o Vite faz proxy de "/api" para o backend
// (ver vite.config.js). Em producao, defina VITE_BACKEND_URL para apontar
// para o backend implantado. Usa import.meta.env (padrao do Vite) em vez de
// process.env, que nao existe no browser.
const backendUrl = import.meta.env?.VITE_BACKEND_URL;

export const API = backendUrl ? `${backendUrl}/api` : "/api";

export default API;
