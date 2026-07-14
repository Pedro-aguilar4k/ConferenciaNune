import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex" style={{ background: '#f5f6fa' }}>

      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] p-12 relative overflow-hidden"
        style={{ background: '#1a1f6e' }}
      >
        {/* subtle background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.3) 40px,
            rgba(255,255,255,0.3) 41px
          )`
        }} />

        {/* Top: logo name */}
        <div className="relative flex items-center gap-3">
          <img
            src="/logo-icon.png"
            alt="ND"
            className="h-8 w-auto brightness-0 invert"
          />
          <span className="text-white font-bold text-lg tracking-widest uppercase">NuneDiesel</span>
        </div>

        {/* Center: headline */}
        <div className="relative flex flex-col items-start gap-10">
          <img
            src="/logo-full.png"
            alt="NuneDiesel"
            className="h-28 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-3 font-medium">
              Pecas Diesel &bull; Linha Pesada
            </p>
            <h1
              className="text-white font-black leading-none uppercase"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}
            >
              FORCA QUE<br />
              <span style={{ color: '#7b84e0' }}>MOVE</span> O<br />
              ESTOQUE.
            </h1>
            <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-xs">
              Conferencia inteligente de NF-e. Controle total das entradas com precisao e velocidade.
            </p>
          </div>
        </div>

        {/* Bottom: version */}
        <p className="relative text-white/20 text-xs tracking-widest uppercase">
          Sistema de Conferencia v2.0
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <img src="/logo-icon.png" alt="ND" className="h-7 w-auto" />
          <span className="font-black text-xl tracking-widest uppercase" style={{ color: '#1a1f6e' }}>
            NuneDiesel
          </span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="font-black text-3xl text-gray-900 uppercase tracking-tight">
              Bem-vindo
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-widest text-gray-500">
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
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#1a1f6e] transition-colors"
                placeholder="seu.usuario"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#1a1f6e] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#1a1f6e' }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
                : <><span>Entrar</span><ArrowRight className="h-4 w-4" /></>
              }
            </button>

          </form>

          <p className="text-center text-[10px] text-gray-300 mt-8 tracking-widest uppercase">
            NuneDiesel Auto Pecas &mdash; Conferencia NF-e
          </p>
        </div>
      </div>
    </div>
  );
}
