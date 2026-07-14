import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

/**
 * Protege uma rota. Exige login e, opcionalmente, uma permissao.
 * - Sem login -> redireciona para /login
 * - Sem a permissao -> mostra aviso de acesso negado
 */
export default function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">Acesso negado</h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
          Seu perfil não tem permissão para acessar esta área. Fale com um administrador se precisar de acesso.
        </p>
      </div>
    );
  }

  return children;
}
