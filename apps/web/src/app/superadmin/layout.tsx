'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/superadmin', label: 'Dashboard Global', icon: '◉' },
  { href: '/superadmin/audit-logs', label: 'Logs de Auditoría', icon: '☰' },
  { href: '/superadmin/operators', label: 'Operadores y Roles', icon: '♢' },
  { href: '/superadmin/settings', label: 'Reglas de Negocio', icon: '⚙' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.user_metadata?.role || payload.role;
      
      if (role !== 'super_admin' && role !== 'support_agent') {
        router.push('/dashboard');
        return;
      }

      setUser({
        name: payload.user_metadata?.name || payload.email?.split('@')[0] || 'Operador',
        email: payload.email || '',
        role: role === 'super_admin' ? 'Super Admin' : 'Soporte',
      });
    } catch {
      router.push('/auth/login');
      return;
    }
    setChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/auth/login');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link href="/superadmin" className="text-xl font-bold tracking-wider text-amber-500 flex items-center gap-2">
            ⚡ AutoShopping <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">SUPERADMIN</span>
          </Link>
        </div>
        <div className="px-6 py-4">
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3">
            <p className="text-xs text-slate-400 font-medium">Operador Conectado</p>
            <p className="text-sm font-semibold truncate text-slate-200 mt-1">{user?.name}</p>
            <span className={`inline-block mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              user?.role === 'Super Admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}>
                <span className="text-base">{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
          <Link href="/dashboard" className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-300 transition-colors border border-slate-700">
            ← Volver al Portal de Clientes
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`fixed inset-0 z-30 bg-black/60 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
          <button onClick={() => setSidebarOpen(true)} aria-label="Menu" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          
          <div className="flex items-center gap-3 text-sm text-slate-400">
            Panel Interno Global
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-bold text-slate-300 border border-slate-700 transition-all">
              Cerrar Sesión
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
