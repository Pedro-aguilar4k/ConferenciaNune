import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardCheck, Package, Truck, Link2, Brain, Users, ChevronLeft, ChevronRight, Menu, X, LogOut } from 'lucide-react';
import { useAuth, PERM } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Visão geral', permission: null },
  { path: '/notas', icon: FileText, label: 'Notas fiscais', permission: null },
  { path: '/conferencia', icon: ClipboardCheck, label: 'Conferência', permission: PERM.CONFERIR },
  { path: '/reconhecimento', icon: Brain, label: 'Reconhecimento', permission: PERM.CADASTROS },
  { path: '/produtos', icon: Package, label: 'Produtos', permission: null },
  { path: '/fornecedores', icon: Truck, label: 'Fornecedores', permission: null },
  { path: '/equivalencias', icon: Link2, label: 'Equivalências', permission: null },
  { path: '/usuarios', icon: Users, label: 'Usuários', permission: PERM.USUARIOS },
];

const routeTitles = [
  { match: /^\/$/, eyebrow: 'Central operacional', title: 'Visão geral' },
  { match: /^\/notas/, eyebrow: 'Recebimento', title: 'Notas fiscais' },
  { match: /^\/conferencia/, eyebrow: 'Operação', title: 'Conferência' },
  { match: /^\/vinculacao/, eyebrow: 'Operação', title: 'Vinculação de produtos' },
  { match: /^\/reconhecimento/, eyebrow: 'Inteligência', title: 'Reconhecimento' },
  { match: /^\/produtos/, eyebrow: 'Cadastros', title: 'Produtos' },
  { match: /^\/fornecedores/, eyebrow: 'Cadastros', title: 'Fornecedores' },
  { match: /^\/equivalencias/, eyebrow: 'Cadastros', title: 'Equivalências' },
  { match: /^\/usuarios/, eyebrow: 'Administração', title: 'Usuários' },
];

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <img src="/logo-icon.png" alt="" className="h-8 w-12 object-contain shrink-0" />
      {!compact && <div className="min-w-0"><p className="text-[15px] font-bold tracking-[0.12em] text-[#101426] uppercase">NuneDiesel</p><p className="text-[9px] font-semibold tracking-[0.18em] text-[#8a91a0] uppercase">Autopeças · Linha pesada</p></div>}
    </div>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const visibleItems = navItems.filter(item => !item.permission || hasPermission(item.permission));
  const page = routeTitles.find(item => item.match.test(location.pathname)) || routeTitles[0];

  const Navigation = ({ labels = true }) => (
    <nav className="app-nav flex-1 px-3 py-5" aria-label="Navegação principal">
      {labels && <p className="px-3 mb-3 text-[9px] font-bold tracking-[0.18em] text-[#9aa0ad] uppercase">Operação</p>}
      <div className="flex flex-col gap-1">
        {visibleItems.map(item => {
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return <Link key={item.path} to={item.path} title={!labels ? item.label : undefined} aria-current={active ? 'page' : undefined} className={`app-nav-link ${active ? 'is-active' : ''} ${labels ? '' : 'justify-center'}`}><item.icon className="h-[18px] w-[18px] shrink-0" />{labels && <span>{item.label}</span>}</Link>;
        })}
      </div>
    </nav>
  );

  const UserCard = ({ labels = true }) => user ? (
    <div className="app-user-card">
      {labels && <div className="app-user-avatar">{(user.nome || user.username || '?')[0].toUpperCase()}</div>}
      {labels && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#202538]">{user.nome || user.username}</p><p className="truncate text-[9px] font-bold tracking-wider text-[#8a91a0] uppercase">{user.role_label || user.role}</p></div>}
      <button onClick={logout} className="app-icon-button" aria-label="Sair" title="Sair"><LogOut className="h-4 w-4" /></button>
    </div>
  ) : null;

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-[#f4f5f7] text-[#101426]">
      <aside className={`${collapsed ? 'w-[76px]' : 'w-[244px]'} hidden md:flex app-sidebar flex-col shrink-0 transition-[width] duration-200`}>
        <div className="app-sidebar-brand"><Brand compact={collapsed} /><button onClick={() => setCollapsed(v => !v)} className="app-icon-button ml-auto" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button></div>
        <Navigation labels={!collapsed} />
        <UserCard labels={!collapsed} />
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-50 md:hidden"><button className="absolute inset-0 bg-[#101426]/40" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" /><aside className="absolute inset-y-0 left-0 flex w-[270px] app-sidebar flex-col"><div className="app-sidebar-brand"><Brand /><button onClick={() => setMobileOpen(false)} className="app-icon-button ml-auto" aria-label="Fechar menu"><X className="h-4 w-4" /></button></div><Navigation /><UserCard /></aside></div>}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-topbar">
          <button onClick={() => setMobileOpen(true)} className="app-icon-button md:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0"><p className="text-[9px] font-bold tracking-[0.17em] text-[#8a91a0] uppercase">{page.eyebrow}</p><p className="truncate text-sm font-semibold text-[#101426]">{page.title}</p></div>
          <div className="ml-auto flex items-center gap-3"><span className="hidden sm:flex items-center gap-2 text-[10px] font-semibold tracking-wider text-[#737b8d] uppercase"><i className="h-1.5 w-1.5 rounded-full bg-[#e56024]" />Sistema online</span><div className="hidden sm:block h-6 w-px bg-[#dfe3eb]" /><Brand compact /></div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto"><div className="app-content mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div></main>
      </div>
    </div>
  );
}
