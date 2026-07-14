import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardCheck, Package, Truck, Link2, Brain, Users, ChevronLeft, ChevronRight, Menu, X, LogOut } from 'lucide-react';
import { useAuth, PERM } from '@/contexts/AuthContext';

const navItems = [
  { path: '/',               icon: LayoutDashboard, label: 'Dashboard',      permission: null },
  { path: '/notas',          icon: FileText,        label: 'Notas Fiscais',  permission: null },
  { path: '/conferencia',    icon: ClipboardCheck,  label: 'Conferencia',    permission: PERM.CONFERIR },
  { path: '/reconhecimento', icon: Brain,           label: 'Reconhecimento', permission: PERM.CADASTROS },
  { path: '/produtos',       icon: Package,         label: 'Produtos',       permission: null },
  { path: '/fornecedores',   icon: Truck,           label: 'Fornecedores',   permission: null },
  { path: '/equivalencias',  icon: Link2,           label: 'Equivalencias',  permission: null },
  { path: '/usuarios',       icon: Users,           label: 'Usuarios',       permission: PERM.USUARIOS },
];

/* Monograma ND em SVG puro — sempre nítido, qualquer fundo */
function NdMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#1E2070" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="'IBM Plex Sans', Arial Black, sans-serif"
        fontWeight="800" fontSize="17" letterSpacing="-1" fill="white">ND</text>
    </svg>
  );
}

function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <NdMark size={28} />
      {!collapsed && (
        <div className="min-w-0 leading-none">
          <p className="text-xs font-black tracking-[0.15em] uppercase text-white leading-tight">NuneDiesel</p>
          <p className="text-[9px] tracking-widest uppercase text-zinc-500 leading-tight">Auto Pecas</p>
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

  const visibleItems = navItems.filter(i => !i.permission || hasPermission(i.permission));

  const NavLinks = ({ showLabels }) => (
    <nav className="flex-1 px-2 py-2 space-y-0.5" role="navigation">
      {visibleItems.map(item => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            title={!showLabels ? item.label : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 relative ${
              isActive
                ? 'bg-[#1E2070] text-white'
                : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[#6B75E8]" aria-hidden="true" />
            )}
            <item.icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#9BA8F0]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
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
            <div className="h-7 w-7 rounded-full bg-[#1E2070] flex items-center justify-center flex-shrink-0 border border-[#4B52C4]/40">
              <span className="text-xs font-bold text-white">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">{user.nome || user.username}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">{user.role_label || user.role}</p>
            </div>
            <button onClick={logout} title="Sair" className="p-1.5 hover:bg-zinc-800 rounded transition-colors" aria-label="Sair">
              <LogOut className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300" />
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
      {/* Desktop sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-52'} hidden md:flex bg-[#0f0f0f] border-r border-zinc-800/80 flex-col transition-all duration-200 flex-shrink-0`}>
        <div className="h-14 px-3 flex items-center justify-between border-b border-zinc-800/80">
          <Logo collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors ml-auto flex-shrink-0"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
              : <ChevronLeft className="h-3.5 w-3.5 text-zinc-600" />}
          </button>
        </div>
        <NavLinks showLabels={!collapsed} />
        <UserFooter showLabels={!collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-56 bg-[#0f0f0f] border-r border-zinc-800/80 flex flex-col">
            <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/80">
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="md:hidden h-14 sticky top-0 z-30 flex items-center gap-3 bg-[#0f0f0f] border-b border-zinc-800/80 px-4">
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
