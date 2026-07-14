import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

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
    <div className="min-h-screen flex items-center justify-center bg-[#0D0E2A] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo-full.png"
            alt="NuneDiesel Auto Pecas"
            className="h-28 object-contain mb-6"
          />
          <p className="text-sm text-[#7B84E0] mt-1 tracking-wide">Sistema de Conferencia de NF-e</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#12134A] border border-[#2D3090]/60 rounded-lg p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-[11px] uppercase tracking-wider text-[#9BA0D0]">
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
              className="w-full bg-[#0D0E2A] border border-[#2D3090]/60 rounded-md px-3 py-2.5 text-sm text-[#E8E9FF] placeholder:text-[#4B52C4]/60 focus:outline-none focus:border-[#4B52C4] transition-colors"
              placeholder="seu.usuario"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[11px] uppercase tracking-wider text-[#9BA0D0]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0D0E2A] border border-[#2D3090]/60 rounded-md px-3 py-2.5 text-sm text-[#E8E9FF] placeholder:text-[#4B52C4]/60 focus:outline-none focus:border-[#4B52C4] transition-colors"
              placeholder="••••••••"
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
            className="w-full flex items-center justify-center gap-2 bg-[#2D3090] hover:bg-[#3A42B0] disabled:opacity-60 disabled:cursor-not-allowed text-[#E8E9FF] text-sm font-semibold rounded-md px-4 py-2.5 transition-colors border border-[#4B52C4]/30"
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

        <p className="text-center text-[11px] text-[#4B52C4]/70 mt-6">NuneDiesel Auto Pecas &mdash; Conferencia v2.0</p>
      </div>
    </div>
  );
}
