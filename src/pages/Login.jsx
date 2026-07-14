import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // Se ja estiver logado (ou apos login), sai da tela de login.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Nao foi possivel entrar. Verifique suas credenciais.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-[#F4F4F5] tracking-tight">NF-e Check</h1>
          <p className="text-sm text-[#71717A] mt-1">Entre para acessar o sistema</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#121212] border border-[#27272A] rounded-lg p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-md px-3 py-2.5 text-sm text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none focus:border-blue-500/60 transition-colors"
              placeholder="seu.usuario"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-md px-3 py-2.5 text-sm text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none focus:border-blue-500/60 transition-colors"
              placeholder="********"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md px-4 py-2.5 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#52525B] mt-6">NF-e Conference v2.0</p>
      </div>
    </div>
  );
}
