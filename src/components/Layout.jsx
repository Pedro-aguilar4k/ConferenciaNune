import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardCheck, Package, Truck, Link2, Brain, Users, ChevronLeft, ChevronRight, Menu, X, LogOut } from 'lucide-react';
import { useAuth, PERM } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { path: '/notas', icon: FileText, label: 'Notas Fiscais', permission: null },
  { path: '/conferencia', icon: ClipboardCheck, label: 'Conferencia', permission: PERM.CONFERIR },
  { path: '/reconhecimento', icon: Brain, label: 'Reconhecimento', permission: PERM.CADASTROS },
  { path: '/produtos', icon: Package, label: 'Produtos', permission: null },
  { path: '/fornecedores', icon: Truck, label: 'Fornecedores', permission: null },
  { path: '/equivalencias', icon: Link2, label: 'Equivalencias', permission: null },
  { path: '/usuarios', icon: Users, label: 'Usuarios', permission: PERM.USUARIOS },
];

function Logo({ collapsed }) {
  if (collapsed) {
    return (
      <img
        src="/logo-icon.png"
        alt="NuneDiesel"
        className="h-8 w-8 object-contain flex-shrink-0"
      />
    );
  }
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img
        src="/logo-icon.png"
        alt="NuneDiesel"
        className="h-8 w-8 object-contain flex-shrink-0"
      />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#9BA0D0] leading-none">Auto Pecas</p>
        <p className="text-base font-bold tracking-wide text-[#E8E9FF] leading-tight">NuneDiesel</p>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const visibleItems = navItems.filter(item => !item.permission || hasPermission(item.permission));

  const NavLinks = ({ showLabels }) => (
    <nav className="flex-1 p-2 space-y-0.5">
      {visibleItems.map(item => {
        const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
        return (
          <Link key={item.path} to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${
              isActive
                ? 'bg-[#2D3090] text-[#E8E9FF] border border-[#4B52C4]/40'
                : 'text-[#9BA0D0] hover:bg-[#1E2070] hover:text-[#E8E9FF]'
            }`}>
            <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#7B84E0]' : ''}`} />
            {showLabels && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const UserFooter = ({ showLabels }) => {
    if (!user) return null;
    return (
      <div className="p-3 border-t border-[#2D3090]/60">
        {showLabels ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#2D3090] border border-[#4B52C4]/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-[#C5C9F0]">{(user.nome || user.username || '?').charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#E8E9FF] truncate leading-tight">{user.nome || user.username}</p>
              <p className="text-[10px] text-[#7B84E0] uppercase tracking-wider truncate">{user.role_label || user.role}</p>
            </div>
            <button onClick={logout} className="p-1.5 hover:bg-[#1E2070] rounded transition-colors flex-shrink-0" aria-label="Sair" title="Sair">
              <LogOut className="h-4 w-4 text-[#9BA0D0]" />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="w-full flex justify-center p-1.5 hover:bg-[#1E2070] rounded transition-colors" aria-label="Sair" title="Sair">
            <LogOut className="h-4 w-4 text-[#9BA0D0]" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0D0E2A]">
      <aside className={`${collapsed ? 'w-16' : 'w-56'} hidden md:flex bg-[#12134A] border-r border-[#2D3090]/60 flex-col transition-all duration-150 flex-shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-[#2D3090]/60 min-h-[56px]">
          {!collapsed && <Logo collapsed={false} />}
          {collapsed && <Logo collapsed={true} />}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-[#1E2070] rounded transition-colors ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4 text-[#9BA0D0]" /> : <ChevronLeft className="h-4 w-4 text-[#9BA0D0]" />}
          </button>
        </div>
        <NavLinks showLabels={!collapsed} />
        <UserFooter showLabels={!collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#12134A] border-r border-[#2D3090]/60 flex flex-col animate-in slide-in-from-left duration-150">
            <div className="p-4 flex items-center justify-between border-b border-[#2D3090]/60 min-h-[56px]">
              <Logo collapsed={false} />
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-[#1E2070] rounded transition-colors ml-auto" aria-label="Fechar menu">
                <X className="h-5 w-5 text-[#9BA0D0]" />
              </button>
            </div>
            <NavLinks showLabels={true} />
            <UserFooter showLabels={true} />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-[#12134A] border-b border-[#2D3090]/60 px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 hover:bg-[#1E2070] rounded transition-colors" aria-label="Abrir menu">
            <Menu className="h-5 w-5 text-[#E8E9FF]" />
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
