import axios from "axios";
import { API } from "@/lib/api";

// Busca genérica usada pelos hooks de React Query.
export async function fetchJson(path, config) {
  const res = await axios.get(`${API}${path}`, config);
  return res.data;
}

// Chaves de cache centralizadas para reuso e prefetch.
export const queryKeys = {
  dashboard: ["dashboard"],
  produtos: (search) => (search ? ["produtos", search] : ["produtos"]),
  notas: ["notas"],
  fornecedores: (search) => (search ? ["fornecedores", search] : ["fornecedores"]),
  equivalencias: (params) => (params ? ["equivalencias", params] : ["equivalencias"]),
  reconhecimento: (params) => (params ? ["reconhecimento", params] : ["reconhecimento"]),
  usuarios: ["usuarios"],
  roles: ["roles"],
};

// Configuração compartilhada: mantém dados por alguns minutos e revalida em segundo plano.
export const listQueryOptions = {
  staleTime: 2 * 60_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: false,
  placeholderData: (prev) => prev,
};

// Pré-carrega os dados mais acessados para que a navegação seja instantânea.
export function prefetchCoreData(queryClient) {
  const warm = (key, path) =>
    queryClient.prefetchQuery({ queryKey: key, queryFn: () => fetchJson(path), ...listQueryOptions });

  warm(queryKeys.dashboard, "/dashboard");
  warm(queryKeys.notas, "/notas");
  warm(queryKeys.produtos(), "/produtos");
  warm(queryKeys.fornecedores(), "/fornecedores");
}
