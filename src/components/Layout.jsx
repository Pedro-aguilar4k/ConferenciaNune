import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardCheck, Package, Truck, Link2, Brain, Users, ChevronLeft, ChevronRight, Menu, X, LogOut } from 'lucide-react';
import { useAuth, PERM } from '@/contexts/AuthContext';

const navItems = [
  { path: '/',              icon: LayoutDashboard, label: 'Dashboard',      permission: null },
  { path: '/notas',         icon: FileText,        label: 'Notas Fiscais',  permission: null },
  { path: '/conferencia',   icon: ClipboardCheck,  label: 'Conferencia',    permission: PERM.CONFERIR },
  { path: '/reconhecimento',icon: Brain,           label: 'Reconhecimento', permission: PERM.CADASTROS },
  { path: '/produtos',      icon: Package,         label: 'Produtos',       permission: null },
  { path: '/fornecedores',  icon: Truck,           label: 'Fornecedores',   permission: null },
  { path: '/equivalencias', icon: Link2,           label: 'Equivalencias',  permission: null },
  { path: '/usuarios',      icon: Users,           label: 'Usuarios',       permission: PERM.USUARIOS },
];

function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <img
        src="/logo-icon.png"
        alt="NuneDiesel"
        className="h-7 w-7 object-contain flex-shrink-0"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
      {!collapsed && (
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-zinc-500 leading-none mb-0.5">Auto Pecas</p>
          <p className="text-sm font-bold tracking-wider text-zinc-100 leading-none">NuneDiesel</p>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const visibleItems = navItems.filter(item => !item.permission || hasPermission(item.permission));

  const NavLinks = ({ showLabels }) => (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {visibleItems.map(item => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            title={!showLabels ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-[#1E2060]/60 text-zinc-100 border-l-2 border-[#4B52C4]'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border-l-2 border-transparent'
            }`}
          >
            <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#6B75E8]' : ''}`} />
            {showLabels && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const UserFooter = ({ showLabels }) => {
    if (!user) return null;
    const initial = (user.nome || user.username || '?').charAt(0).toUpperCase();
    return (
      <div className="p-3 border-t border-zinc-800">
        {showLabels ? (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-[#2D3090] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-zinc-100">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-300 truncate leading-tight">{user.nome || user.username}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">{user.role_label || user.role}</p>
            </div>
            <button onClick={logout} title="Sair" className="p-1.5 hover:bg-zinc-800 rounded transition-colors flex-shrink-0" aria-label="Sair">
              <LogOut className="h-3.5 w-3.5 text-zinc-500" />
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Sair" className="w-full flex justify-center p-1.5 hover:bg-zinc-800 rounded transition-colors" aria-label="Sair">
            <LogOut className="h-4 w-4 text-zinc-500" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A]">

      <aside className={`${collapsed ? 'w-14' : 'w-52'} hidden md:flex bg-[#111111] border-r border-zinc-800 flex-col transition-all duration-150 flex-shrink-0`}>
        <div className="h-14 px-3 flex items-center justify-between border-b border-zinc-800">
          <Logo collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors ml-auto flex-shrink-0"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
              : <ChevronLeft className="h-3.5 w-3.5 text-zinc-500" />
            }
          </button>
        </div>
        <NavLinks showLabels={!collapsed} />
        <UserFooter showLabels={!collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-56 bg-[#111111] border-r border-zinc-800 flex flex-col">
            <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800">
              <Logo collapsed={false} />
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded transition-colors" aria-label="Fechar menu">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            <NavLinks showLabels={true} />
            <UserFooter showLabels={true} />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <div className="md:hidden h-14 sticky top-0 z-30 flex items-center gap-3 bg-[#111111] border-b border-zinc-800 px-4">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 hover:bg-zinc-800 rounded transition-colors" aria-label="Abrir menu">
            <Menu className="h-5 w-5 text-zinc-300" />
          </button>
          <Logo collapsed={false} />
        </div>
        <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
