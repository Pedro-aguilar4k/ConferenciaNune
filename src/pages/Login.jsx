import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">

      <div className="w-full max-w-[360px]">

        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo-full.png"
            alt="NuneDiesel Auto Pecas"
            className="h-24 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <p className="text-xs text-zinc-500 mt-4 tracking-[0.12em] uppercase">Sistema de Conferencia de NF-e</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111111] border border-zinc-800 rounded-lg p-6 space-y-4">

          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-[10px] uppercase tracking-widest text-zinc-500">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-[#4B52C4] transition-colors"
              placeholder="seu.usuario"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-zinc-500">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-[#4B52C4] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#2D3090] hover:bg-[#3A42B0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md px-4 py-2.5 transition-colors mt-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</> : 'Entrar'}
          </button>

        </form>

        <p className="text-center text-[10px] text-zinc-700 mt-6 tracking-wider uppercase">
          NuneDiesel Auto Pecas &mdash; v2.0
        </p>

      </div>
    </div>
  );
}
