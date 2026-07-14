import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Login() {
  const { login, user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Não foi possível entrar. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <header className="login-header">
        <div className="login-brand" aria-label="NuneDiesel Auto Peças">
          <img src="/logo-icon.png" alt="" className="login-brand-mark" />
          <div>
            <p className="login-brand-name">NuneDiesel</p>
            <p className="login-brand-detail">Auto Peças</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="login-environment">
            <span className="login-environment-dot" aria-hidden="true" />
            Ambiente interno
          </div>
          <button type="button" onClick={toggleTheme} className="login-theme-toggle" aria-label={resolvedTheme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={resolvedTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
            {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <section className="login-stage">
        <div className="login-brand-panel" aria-hidden="true">
          <div className="login-orbit login-orbit-outer" />
          <div className="login-orbit login-orbit-inner" />
          <div className="login-technical-grid" />
          <div className="login-serial">ND / 01</div>

          <div className="login-brand-copy">
            <span className="login-eyebrow"><i /> Operação de entrada</span>
            <h1>
              Precisão que
              <br />
              mantém tudo
              <br />
              <strong>em movimento.</strong>
            </h1>
            <p>
              Conferência de NF-e, vinculação de produtos e controle de entrada em um fluxo único.
            </p>
          </div>

          <div className="login-specs">
            <div><b>NF-e</b><span>Conferência</span></div>
            <div><b>SKU</b><span>Vinculação</span></div>
            <div><b>24/7</b><span>Operação</span></div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-wrap">
            <div className="login-form-icon" aria-hidden="true">
              <LockKeyhole size={20} strokeWidth={1.8} />
            </div>
            <div className="login-form-heading">
              <p className="login-kicker">Acesso ao sistema</p>
              <h2>Bem-vindo de volta.</h2>
              <p>Use suas credenciais para continuar sua operação.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="username">Usuário</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoFocus
                  aria-invalid={Boolean(error)}
                  placeholder="Digite seu usuário"
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">Senha</label>
                <div className="login-password-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    aria-invalid={Boolean(error)}
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  <span aria-hidden="true">!</span>
                  <p>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="login-submit">
                <span>{loading ? 'Autenticando' : 'Entrar no sistema'}</span>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              </button>
            </form>

            <div className="login-security">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Sessão protegida e acesso restrito</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="login-footer">
        <span>NuneDiesel Auto Peças</span>
        <span>Conferência NF-e · v2.0</span>
      </footer>
    </main>
  );
}
